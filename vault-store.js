const VaultStore = (() => {
  const DB_NAME = 'ciphervault-local';
  const DB_VERSION = 1;
  const CONFIG_STORE = 'config';
  const ENTRY_STORE = 'entries';
  const CONFIG_ID = 'vault';
  const LOCK_DURATION_MS = 15 * 60 * 1000;
  const MAX_BACKUP_ENTRIES = 5000;

  function open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(CONFIG_STORE)) db.createObjectStore(CONFIG_STORE, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(ENTRY_STORE)) db.createObjectStore(ENTRY_STORE, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Unable to open local vault database'));
    });
  }

  function requestValue(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB request failed'));
    });
  }

  async function getConfig() {
    const db = await open();
    try {
      const tx = db.transaction(CONFIG_STORE, 'readonly');
      const config = await requestValue(tx.objectStore(CONFIG_STORE).get(CONFIG_ID));
      return config ? validateConfig(config) : config;
    } finally { db.close(); }
  }

  async function putConfig(config) {
    const db = await open();
    try {
      const tx = db.transaction(CONFIG_STORE, 'readwrite');
      tx.objectStore(CONFIG_STORE).put({ ...config, id: CONFIG_ID });
      await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error || new Error('Unable to save vault configuration')); tx.onabort = () => reject(tx.error || new Error('Vault configuration write aborted')); });
    } finally { db.close(); }
  }

  async function createVault({ salt, iterations, verifier }) {
    const now = new Date().toISOString();
    await putConfig({ id: CONFIG_ID, schema: 1, salt, iterations, verifier, createdAt: now, failedAttempts: 0, lockUntil: 0 });
  }

  async function recordFailedAttempt() {
    const db = await open();
    try {
      const tx = db.transaction(CONFIG_STORE, 'readwrite');
      const store = tx.objectStore(CONFIG_STORE);
      const config = validateConfig(await requestValue(store.get(CONFIG_ID)));
      const failedAttempts = (config.failedAttempts || 0) + 1;
      const lockUntil = failedAttempts >= 3 ? Date.now() + LOCK_DURATION_MS : 0;
      store.put({ ...config, failedAttempts: lockUntil ? 0 : failedAttempts, lockUntil });
      await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error || new Error('Unable to record attempt')); tx.onabort = () => reject(tx.error || new Error('Attempt update aborted')); });
      return { failedAttempts, lockUntil };
    } finally { db.close(); }
  }

  async function resetFailedAttempts() {
    const config = await getConfig();
    if (config) await putConfig({ ...config, failedAttempts: 0, lockUntil: 0 });
  }

  async function completeSuccessfulUnlock() {
    const db = await open();
    try {
      const tx = db.transaction(CONFIG_STORE, 'readwrite');
      const store = tx.objectStore(CONFIG_STORE);
      const config = validateConfig(await requestValue(store.get(CONFIG_ID)));
      if (config.lockUntil > Date.now()) {
        await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error || new Error('Unable to check vault lock')); tx.onabort = () => reject(tx.error || new Error('Vault lock check aborted')); });
        return { locked: true, config };
      }
      const cleared = { ...config, failedAttempts: 0, lockUntil: 0 };
      store.put(cleared);
      await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error || new Error('Unable to complete successful unlock')); tx.onabort = () => reject(tx.error || new Error('Successful unlock transaction aborted')); });
      return { locked: false, config: cleared };
    } finally { db.close(); }
  }

  async function saveBiometric(biometric) {
    const config = await getConfig();
    if (!config || !isBiometric(biometric)) throw new Error('Biometric metadata is invalid');
    await putConfig({ ...config, biometric });
  }

  async function getEntries() {
    const db = await open();
    try {
      const tx = db.transaction(ENTRY_STORE, 'readonly');
      const entries = await requestValue(tx.objectStore(ENTRY_STORE).getAll());
      return entries.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    } finally { db.close(); }
  }

  async function putEntry(entry) {
    const db = await open();
    try {
      const tx = db.transaction(ENTRY_STORE, 'readwrite');
      tx.objectStore(ENTRY_STORE).put(entry);
      await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error || new Error('Unable to save encrypted entry')); tx.onabort = () => reject(tx.error || new Error('Entry write aborted')); });
    } finally { db.close(); }
  }

  async function exportBackup() {
    const config = await getConfig();
    if (!config) throw new Error('Vault has not been configured');
    const entries = await getEntries();
    const { id, failedAttempts, lockUntil, biometric, ...backupConfig } = config;
    return { format: 'ciphervault.local-backup', version: 1, exportedAt: new Date().toISOString(), config: backupConfig, entries };
  }

  function isBase64(value) {
    return typeof value === 'string' && value.length > 0 && value.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(value);
  }

  function isEnvelope(value) {
    return value && value.version === 1 && typeof value.iv === 'string' && value.iv.length === 16 && isBase64(value.iv) && isBase64(value.ciphertext);
  }

  function isTimestamp(value) {
    return typeof value === 'string' && Number.isFinite(Date.parse(value));
  }

  function base64ByteLength(value) {
    try { return atob(value).length; } catch { return -1; }
  }

  function isBiometric(value) {
    return value && value.version === 1 && typeof value.credentialId === 'string' && isBase64(value.credentialId) && base64ByteLength(value.credentialId) >= 8 && base64ByteLength(value.credentialId) <= 512 && typeof value.prfSalt === 'string' && isBase64(value.prfSalt) && base64ByteLength(value.prfSalt) === 32 && isEnvelope(value.wrappedKey) && isTimestamp(value.createdAt);
  }

  function validateConfig(config) {
    if (!config || config.id !== CONFIG_ID || config.schema !== 1 || typeof config.salt !== 'string' || config.salt.length !== 24 || !isBase64(config.salt) || !Number.isInteger(config.iterations) || config.iterations < 100000 || config.iterations > 1000000 || !isEnvelope(config.verifier) || !isTimestamp(config.createdAt) || !Number.isInteger(config.failedAttempts) || config.failedAttempts < 0 || config.failedAttempts > 2 || !Number.isFinite(config.lockUntil) || config.lockUntil < 0 || (config.biometric !== undefined && !isBiometric(config.biometric))) throw new Error('Vault configuration is invalid');
    return config;
  }

  function validateBackup(backup) {
    if (!backup || backup.format !== 'ciphervault.local-backup' || backup.version !== 1 || !backup.config || !Array.isArray(backup.entries)) throw new Error('Unsupported CipherVault backup');
    const { config } = backup;
    if ('biometric' in config || config.schema !== 1 || typeof config.salt !== 'string' || config.salt.length !== 24 || !isBase64(config.salt) || !Number.isInteger(config.iterations) || config.iterations < 100000 || config.iterations > 1000000 || !isEnvelope(config.verifier) || !isTimestamp(config.createdAt)) throw new Error('Backup encryption metadata is invalid');
    if (backup.entries.length > MAX_BACKUP_ENTRIES) throw new Error('Backup contains too many entries');
    if (!backup.entries.every((entry) => typeof entry?.id === 'string' && entry.id.length >= 8 && entry.id.length <= 128 && isTimestamp(entry.createdAt) && isTimestamp(entry.updatedAt) && isEnvelope(entry.encrypted))) throw new Error('Backup entries are invalid');
    return backup;
  }

  async function replaceFromBackup(backup) {
    const valid = validateBackup(backup);
    const db = await open();
    try {
      const tx = db.transaction([CONFIG_STORE, ENTRY_STORE], 'readwrite');
      const configStore = tx.objectStore(CONFIG_STORE);
      const entryStore = tx.objectStore(ENTRY_STORE);
      configStore.clear();
      entryStore.clear();
      const { schema, salt, iterations, verifier, createdAt } = valid.config;
      configStore.put({ id: CONFIG_ID, schema, salt, iterations, verifier, createdAt, failedAttempts: 0, lockUntil: 0 });
      valid.entries.forEach((entry) => entryStore.put(entry));
      await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error || new Error('Unable to import backup')); tx.onabort = () => reject(tx.error || new Error('Backup import aborted')); });
    } finally { db.close(); }
  }

  function createEntryId() {
    return crypto.randomUUID ? crypto.randomUUID() : `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  return { LOCK_DURATION_MS, MAX_BACKUP_ENTRIES, getConfig, validateConfig, createVault, recordFailedAttempt, resetFailedAttempts, completeSuccessfulUnlock, saveBiometric, getEntries, putEntry, exportBackup, validateBackup, replaceFromBackup, createEntryId };
})();
