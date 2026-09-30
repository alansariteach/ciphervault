const VaultCrypto = (() => {
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();
  const ITERATIONS = 600000;
  const KEY_LENGTH = 256;

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

  function randomBase64(length) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytesToBase64(bytes);
  }

  async function deriveKey(password, saltBase64, iterations = ITERATIONS, extractable = false) {
    const passwordKey = await crypto.subtle.importKey('raw', textEncoder.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: base64ToBytes(saltBase64), iterations, hash: 'SHA-256' },
      passwordKey,
      { name: 'AES-GCM', length: KEY_LENGTH },
      extractable,
      ['encrypt', 'decrypt']
    );
  }

  async function encryptJSON(key, data) {
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);
    const plaintext = textEncoder.encode(JSON.stringify(data));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
    return { version: 1, iv: bytesToBase64(iv), ciphertext: bytesToBase64(ciphertext) };
  }

  async function decryptJSON(key, envelope) {
    if (!envelope || envelope.version !== 1 || !envelope.iv || !envelope.ciphertext) throw new Error('Invalid encrypted envelope');
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(envelope.iv) }, key, base64ToBytes(envelope.ciphertext));
    return JSON.parse(textDecoder.decode(plaintext));
  }

  async function createVerifier(key) {
    return encryptJSON(key, { type: 'ciphervault-verifier', version: 1, createdAt: new Date().toISOString() });
  }

  async function verifyKey(key, verifier) {
    try {
      const payload = await decryptJSON(key, verifier);
      return payload?.type === 'ciphervault-verifier' && payload.version === 1;
    } catch {
      return false;
    }
  }

  function isAcceptableMasterPassword(value) {
    return typeof value === 'string' && value.length >= 12 && value.length <= 256;
  }

  return { ITERATIONS, randomBase64, deriveKey, encryptJSON, decryptJSON, createVerifier, verifyKey, isAcceptableMasterPassword };
})();
