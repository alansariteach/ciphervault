const rain = document.querySelector('#binary-rain');
const menuToggle = document.querySelector('#menu-toggle');
const menuClose = document.querySelector('#menu-close');
const contactPanel = document.querySelector('#contact-panel');
const menuScrim = document.querySelector('#menu-scrim');
const unlockForm = document.querySelector('#unlock-form');
const passwordInput = document.querySelector('#master-password');
const confirmInput = document.querySelector('#confirm-password');
const confirmField = document.querySelector('#confirm-field');
const visibilityToggle = document.querySelector('#visibility-toggle');
const confirmVisibilityToggle = document.querySelector('#confirm-visibility-toggle');
const unlockButton = document.querySelector('#unlock-button');
const unlockLabel = document.querySelector('#unlock-label');
const biometricUnlockButton = document.querySelector('#biometric-unlock');
const biometricUnlockNote = document.querySelector('#biometric-unlock-note');
const accessCode = document.querySelector('#access-code');
const accessModeNote = document.querySelector('#access-mode-note');
const formState = document.querySelector('#form-state');
const vaultHost = document.querySelector('#vault-host');
const vaultFrame = document.querySelector('#vault-frame');
const year = document.querySelector('#year');
const t = (key, values) => window.CipherVaultLanguage?.t(key, values) ?? key;

let currentConfig;
let accessMode = 'loading';
let activeKey = null;
let resizeTimer;

year.textContent = new Date().getFullYear();

function buildBinaryRain() {
  const columnGap = window.innerWidth < 560 ? 18 : 24;
  const columns = Math.ceil(window.innerWidth / columnGap);
  const pattern = '0100101101001010110100101011010010100101101001010110100101011010';
  rain.innerHTML = '';
  for (let index = 0; index < columns; index += 1) {
    const stream = document.createElement('span');
    const shift = index % 11;
    stream.className = 'binary-stream';
    stream.textContent = `${pattern.slice(shift)}${pattern.slice(0, shift)}`.split('').join('\n');
    stream.style.left = `${index * columnGap + 3}px`;
    stream.style.setProperty('--fall-duration', `${15 + (index % 9) * 2}s`);
    stream.style.setProperty('--fall-delay', `${-(index % 13) * 1.45}s`);
    stream.style.opacity = `${0.24 + (index % 5) * 0.09}`;
    rain.appendChild(stream);
  }
}

function toggleMenu(open) {
  contactPanel.classList.toggle('is-open', open);
  menuScrim.classList.toggle('is-visible', open);
  contactPanel.setAttribute('aria-hidden', String(!open));
  menuToggle.setAttribute('aria-expanded', String(open));
  if (open) menuClose.focus(); else menuToggle.focus();
}

function setState(message = '', state = '') {
  formState.textContent = message;
  formState.className = `form-state${state ? ` is-${state}` : ''}`;
}

function syncVisibilityLabel(button, input, key = 'showPassword') {
  button.setAttribute('aria-label', t(input.type === 'password' ? key : 'hidePassword'));
}

function setBusy(busy) {
  unlockButton.disabled = busy;
  passwordInput.disabled = busy;
  confirmInput.disabled = busy;
  biometricUnlockButton.disabled = busy;
  unlockLabel.textContent = busy ? t('processing') : t(accessMode === 'create' ? 'createVault' : 'openVault');
}

async function syncBiometricUnlock() {
  const potential = accessMode === 'unlock' && Boolean(currentConfig?.biometric) && Boolean(window.VaultBiometric?.isSupported?.());
  if (!potential) {
    biometricUnlockButton.hidden = true;
    biometricUnlockNote.hidden = true;
    biometricUnlockButton.disabled = true;
    return;
  }
  const available = await VaultBiometric.isPlatformAuthenticatorAvailable();
  if (accessMode !== 'unlock' || !currentConfig?.biometric) return;
  biometricUnlockButton.hidden = !available;
  biometricUnlockNote.hidden = !available;
  biometricUnlockButton.disabled = !available;
}

function applyAccessMode(mode) {
  accessMode = mode;
  unlockForm.hidden = false;
  const creating = mode === 'create';
  confirmField.hidden = !creating;
  passwordInput.autocomplete = creating ? 'new-password' : 'current-password';
  accessCode.textContent = creating ? 'LOCAL VAULT / CREATE' : 'LOCAL VAULT / UNLOCK';
  accessModeNote.textContent = t(creating ? 'createVaultNote' : 'unlockVaultNote');
  unlockLabel.textContent = t(creating ? 'createVault' : 'openVault');
  setState();
  setBusy(false);
  syncBiometricUnlock();
  passwordInput.focus();
}

function lockAccessUntil(lockUntil) {
  accessMode = 'locked';
  unlockForm.hidden = false;
  setBusy(true);
  syncBiometricUnlock();
  const time = new Date(lockUntil).toLocaleTimeString(document.documentElement.lang === 'ar' ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit' });
  setState(t('vaultLockedUntil', { time }), 'locked');
  window.setTimeout(initAccess, Math.max(1000, lockUntil - Date.now() + 250));
}

async function initAccess() {
  try {
    currentConfig = await VaultStore.getConfig();
    if (currentConfig?.lockUntil && currentConfig.lockUntil > Date.now()) {
      lockAccessUntil(currentConfig.lockUntil);
      return;
    }
    applyAccessMode(currentConfig ? 'unlock' : 'create');
  } catch {
    unlockForm.hidden = false;
    setState(t('storageUnavailable'), 'error');
  }
}

function sendUnlockToFrame() {
  if (!activeKey || !vaultFrame.contentWindow) return;
  vaultFrame.contentWindow.postMessage({ type: 'ciphervault:unlock', key: activeKey }, window.location.origin);
}

function sendUnlockWithRetry() {
  sendUnlockToFrame();
  window.setTimeout(sendUnlockToFrame, 120);
  window.setTimeout(sendUnlockToFrame, 500);
}

function openVault(key) {
  activeKey = key;
  passwordInput.value = '';
  confirmInput.value = '';
  vaultHost.hidden = false;
  document.body.classList.add('vault-session-active');
  toggleMenu(false);
  sendUnlockWithRetry();
}

function closeVault() {
  activeKey = null;
  vaultHost.hidden = true;
  document.body.classList.remove('vault-session-active');
  vaultFrame.src = `vault.html?embedded=1&reset=${Date.now()}`;
  initAccess();
}

function toggleVisibility(button, input, key) {
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  button.classList.toggle('is-open', show);
  button.setAttribute('aria-pressed', String(show));
  syncVisibilityLabel(button, input, key);
  input.focus();
}

async function unlockWithBiometrics() {
  if (accessMode !== 'unlock' || !currentConfig?.biometric || !window.VaultBiometric?.isSupported?.()) return;
  const latestConfig = await VaultStore.getConfig().catch(() => null);
  if (!latestConfig) return;
  currentConfig = latestConfig;
  if (currentConfig.lockUntil > Date.now()) {
    lockAccessUntil(currentConfig.lockUntil);
    return;
  }
  if (!await VaultBiometric.isPlatformAuthenticatorAvailable()) {
    setState(t('biometricUnlockFailed'), 'error');
    syncBiometricUnlock();
    return;
  }
  setBusy(true);
  biometricUnlockButton.disabled = true;
  setState(t('biometricPrompt'));
  try {
    const key = await VaultBiometric.unlock(currentConfig.biometric);
    if (!await VaultCrypto.verifyKey(key, currentConfig.verifier)) throw new Error('Biometric vault key did not verify');
    const result = await VaultStore.completeSuccessfulUnlock();
    if (result.locked) {
      lockAccessUntil(result.config.lockUntil);
      return;
    }
    currentConfig = result.config;
    openVault(key);
  } catch {
    setBusy(false);
    syncBiometricUnlock();
    setState(t('biometricUnlockFailed'), 'error');
  }
}

menuToggle.addEventListener('click', () => toggleMenu(true));
menuClose.addEventListener('click', () => toggleMenu(false));
menuScrim.addEventListener('click', () => toggleMenu(false));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && contactPanel.classList.contains('is-open')) toggleMenu(false); });
visibilityToggle.addEventListener('click', () => toggleVisibility(visibilityToggle, passwordInput, accessMode === 'create' ? 'masterPassword' : 'showMaster'));
confirmVisibilityToggle.addEventListener('click', () => toggleVisibility(confirmVisibilityToggle, confirmInput, 'showPassword'));
biometricUnlockButton.addEventListener('click', unlockWithBiometrics);
vaultFrame.addEventListener('load', sendUnlockWithRetry);

unlockForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (accessMode === 'locked') return;
  const password = passwordInput.value;
  if (!password) {
    passwordInput.setAttribute('aria-invalid', 'true');
    setState(t('masterEmpty'), 'error');
    passwordInput.focus();
    return;
  }
  if (accessMode === 'create') {
    if (!VaultCrypto.isAcceptableMasterPassword(password)) {
      passwordInput.setAttribute('aria-invalid', 'true');
      setState(t('masterTooShort'), 'error');
      return;
    }
    if (password !== confirmInput.value) {
      confirmInput.setAttribute('aria-invalid', 'true');
      setState(t('passwordMismatch'), 'error');
      return;
    }
    setBusy(true);
    try {
      const salt = VaultCrypto.randomBase64(16);
      const key = await VaultCrypto.deriveKey(password, salt);
      const verifier = await VaultCrypto.createVerifier(key);
      await VaultStore.createVault({ salt, iterations: VaultCrypto.ITERATIONS, verifier });
      currentConfig = await VaultStore.getConfig();
      openVault(key);
    } catch {
      setBusy(false);
      setState(t('vaultCreateError'), 'error');
    }
    return;
  }

  setBusy(true);
  try {
    const latestConfig = await VaultStore.getConfig();
    if (!latestConfig) throw new Error('Vault configuration is unavailable');
    currentConfig = latestConfig;
    if (currentConfig.lockUntil > Date.now()) {
      lockAccessUntil(currentConfig.lockUntil);
      return;
    }
    const key = await VaultCrypto.deriveKey(password, currentConfig.salt, currentConfig.iterations);
    const verified = await VaultCrypto.verifyKey(key, currentConfig.verifier);
    if (!verified) throw new Error('Incorrect master password');
    const result = await VaultStore.completeSuccessfulUnlock();
    if (result.locked) {
      lockAccessUntil(result.config.lockUntil);
      return;
    }
    currentConfig = result.config;
    openVault(key);
  } catch {
    setBusy(false);
    const result = await VaultStore.recordFailedAttempt().catch(() => ({ failedAttempts: 1, lockUntil: 0 }));
    passwordInput.value = '';
    passwordInput.setAttribute('aria-invalid', 'true');
    if (result.lockUntil) {
      lockAccessUntil(result.lockUntil);
    } else {
      setState(t('wrongAttempt', { count: result.failedAttempts }), 'error');
      passwordInput.focus();
    }
  }
});

passwordInput.addEventListener('input', () => passwordInput.removeAttribute('aria-invalid'));
confirmInput.addEventListener('input', () => confirmInput.removeAttribute('aria-invalid'));
document.addEventListener('ciphervault:languagechange', () => {
  syncVisibilityLabel(visibilityToggle, passwordInput, accessMode === 'create' ? 'masterPassword' : 'showMaster');
  syncVisibilityLabel(confirmVisibilityToggle, confirmInput, 'showPassword');
  if (accessMode === 'create' || accessMode === 'unlock') applyAccessMode(accessMode);
});
document.addEventListener('ciphervault:biometricchange', initAccess);
window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin || event.source !== vaultFrame.contentWindow) return;
  if (event.data?.type === 'ciphervault:ready') sendUnlockWithRetry();
  if (event.data?.type === 'ciphervault:lock') closeVault();
  if (event.data?.type === 'ciphervault:install') window.CipherVaultPWA?.triggerInstall();
});
window.addEventListener('resize', () => { window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(buildBinaryRain, 160); });

buildBinaryRain();
initAccess();
