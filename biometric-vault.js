const VaultBiometric = (() => {
  const PRF_LABEL = 'ciphervault-biometric-wrap-v1';
  const encoder = new TextEncoder();

  function bytesToBase64(bytes) {
    let binary = '';
    const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    for (let offset = 0; offset < view.length; offset += 0x8000) binary += String.fromCharCode(...view.subarray(offset, offset + 0x8000));
    return btoa(binary);
  }

  function base64ToBytes(value) {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  }

  function base64Url(bytes) {
    return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function randomBytes(length) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
  }

  function isSupported() {
    return Boolean(window.isSecureContext && window.PublicKeyCredential && navigator.credentials?.create && navigator.credentials?.get);
  }

  async function isPlatformAuthenticatorAvailable() {
    if (!isSupported()) return false;
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') return false;
    try { return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(); } catch { return false; }
  }

  async function createWrappingKey(prfOutput) {
    const material = new Uint8Array(await crypto.subtle.digest('SHA-256', prfOutput));
    return crypto.subtle.importKey('raw', material, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  }

  function prfResult(credential) {
    const first = credential?.getClientExtensionResults?.()?.prf?.results?.first;
    if (!first) return null;
    return first instanceof ArrayBuffer ? new Uint8Array(first) : new Uint8Array(first.buffer, first.byteOffset, first.byteLength);
  }

  async function evaluatePrf(metadata) {
    const credentialId = base64ToBytes(metadata.credentialId);
    const salt = base64ToBytes(metadata.prfSalt);
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomBytes(32),
        allowCredentials: [{ type: 'public-key', id: credentialId }],
        userVerification: 'required',
        timeout: 60000,
        extensions: { prf: { evalByCredential: { [base64Url(credentialId)]: { first: salt } } } }
      }
    });
    const output = prfResult(assertion);
    if (!output || output.byteLength < 32) throw new Error('Biometric PRF is unavailable');
    return output;
  }

  async function enroll(masterKey) {
    if (!isSupported() || !(masterKey instanceof CryptoKey)) throw new Error('Biometric unlock is unavailable');
    const prfSalt = randomBytes(32);
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: randomBytes(32),
        rp: { name: 'CipherVault' },
        user: { id: randomBytes(32), name: 'ciphervault-local', displayName: 'CipherVault local vault' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'required', userVerification: 'required' },
        timeout: 60000,
        attestation: 'none',
        extensions: { prf: { eval: { first: prfSalt } } }
      }
    });
    if (!credential?.rawId) throw new Error('Biometric credential was not created');

    const metadata = {
      version: 1,
      credentialId: bytesToBase64(new Uint8Array(credential.rawId)),
      prfSalt: bytesToBase64(prfSalt),
      createdAt: new Date().toISOString()
    };
    const output = prfResult(credential) || await evaluatePrf(metadata);
    const wrappingKey = await createWrappingKey(output);
    const rawKey = new Uint8Array(await crypto.subtle.exportKey('raw', masterKey));
    metadata.wrappedKey = await VaultCrypto.encryptJSON(wrappingKey, {
      type: PRF_LABEL,
      version: 1,
      rawKey: bytesToBase64(rawKey)
    });
    rawKey.fill(0);
    return metadata;
  }

  async function unlock(metadata) {
    if (!isSupported() || !metadata?.credentialId || !metadata?.prfSalt || !metadata?.wrappedKey) throw new Error('Biometric unlock is unavailable');
    const output = await evaluatePrf(metadata);
    const wrappingKey = await createWrappingKey(output);
    const payload = await VaultCrypto.decryptJSON(wrappingKey, metadata.wrappedKey);
    if (!payload || payload.type !== PRF_LABEL || payload.version !== 1 || typeof payload.rawKey !== 'string') throw new Error('Biometric key record is invalid');
    const rawKey = base64ToBytes(payload.rawKey);
    try {
      return await crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    } finally {
      rawKey.fill(0);
    }
  }

  return { isSupported, isPlatformAuthenticatorAvailable, enroll, unlock };
})();

(() => {
  const setupButton = document.querySelector('#biometric-setup');
  const modal = document.querySelector('#biometric-modal');
  if (!setupButton || !modal) return;

  const closeButton = document.querySelector('#biometric-close');
  const cancelButton = document.querySelector('#biometric-cancel');
  const form = document.querySelector('#biometric-form');
  const passwordInput = document.querySelector('#biometric-master-password');
  const state = document.querySelector('#biometric-state');
  const status = document.querySelector('#biometric-status');
  const submitButton = document.querySelector('#biometric-submit');
  const t = (key, values) => window.CipherVaultLanguage?.t(key, values) ?? key;

  function toggle(open) {
    modal.hidden = !open;
    if (open) passwordInput.focus();
    else {
      passwordInput.value = '';
      state.textContent = '';
    }
  }

  async function refresh() {
    const supported = await VaultBiometric.isPlatformAuthenticatorAvailable();
    const config = await VaultStore.getConfig().catch(() => null);
    const enabled = Boolean(config?.biometric);
    setupButton.disabled = !supported || enabled;
    status.textContent = !supported ? t('biometricSetupUnavailable') : (enabled ? t('biometricEnabled') : t('biometricSetupAvailable'));
    setupButton.textContent = t(enabled ? 'biometricEnabled' : 'biometricSetup');
  }

  setupButton.addEventListener('click', async () => {
    if (!(await VaultBiometric.isPlatformAuthenticatorAvailable())) { await refresh(); return; }
    toggle(true);
  });
  closeButton.addEventListener('click', () => toggle(false));
  cancelButton.addEventListener('click', () => toggle(false));
  modal.addEventListener('click', (event) => { if (event.target === modal) toggle(false); });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!passwordInput.value) return;
    submitButton.disabled = true;
    state.textContent = t('processing');
    try {
      const config = await VaultStore.getConfig();
      const masterKey = await VaultCrypto.deriveKey(passwordInput.value, config.salt, config.iterations, true);
      passwordInput.value = '';
      if (!await VaultCrypto.verifyKey(masterKey, config.verifier)) throw new Error('Incorrect master password');
      const metadata = await VaultBiometric.enroll(masterKey);
      await VaultStore.saveBiometric(metadata);
      toggle(false);
      await refresh();
      document.dispatchEvent(new CustomEvent('ciphervault:biometricchange'));
    } catch {
      passwordInput.value = '';
      state.textContent = t('biometricSetupError');
    } finally {
      submitButton.disabled = false;
    }
  });

  document.addEventListener('ciphervault:languagechange', refresh);
  refresh();
})();
