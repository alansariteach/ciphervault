const vaultRain = document.querySelector('#vault-binary-rain');
const vaultSessionScreen = document.querySelector('#vault-session-screen');
const vaultMenuToggle = document.querySelector('#vault-menu-toggle');
const vaultMenuClose = document.querySelector('#vault-menu-close');
const vaultContactPanel = document.querySelector('#vault-contact-panel');
const vaultMenuScrim = document.querySelector('#vault-menu-scrim');
const vaultSearch = document.querySelector('#vault-search');
const vaultList = document.querySelector('#vault-list');
const entryCount = document.querySelector('#entry-count');
const searchLabel = document.querySelector('#search-result-label');
const emptyVault = document.querySelector('#empty-vault');
const noResults = document.querySelector('#no-results');
const addAccountButton = document.querySelector('#add-account');
const accountModal = document.querySelector('#account-modal');
const accountForm = document.querySelector('#account-form');
const modalClose = document.querySelector('#modal-close');
const modalCancel = document.querySelector('#modal-cancel');
const vaultToast = document.querySelector('#vault-toast');
const lockVaultButton = document.querySelector('#lock-vault');
const vaultYear = document.querySelector('#vault-year');
const passwordCheckButton = document.querySelector('#password-check');
const passwordCheckModal = document.querySelector('#password-check-modal');
const passwordCheckForm = document.querySelector('#password-check-form');
const passwordCheckInput = document.querySelector('#password-check-input');
const passwordCheckClose = document.querySelector('#password-check-close');
const passwordCheckCancel = document.querySelector('#password-check-cancel');
const passwordCheckSubmit = document.querySelector('#password-check-submit');
const passwordCheckResult = document.querySelector('#password-check-result');
const importModal = document.querySelector('#import-modal');
const importClose = document.querySelector('#import-close');
const importCancel = document.querySelector('#import-cancel');
const importFile = document.querySelector('#import-file');
const importFilePicker = document.querySelector('#import-file-picker');
const importFileName = document.querySelector('#import-file-name');
const importForm = document.querySelector('#import-form');
const importMasterPassword = document.querySelector('#import-master-password');
const importState = document.querySelector('#import-state');
const importSubmit = document.querySelector('#import-submit');
const t = (key, values) => window.CipherVaultLanguage?.t(key, values) ?? key;
const SESSION_IDLE_MS = 15 * 60 * 1000;
const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
const MAX_SITE_LENGTH = 160;
const MAX_USERNAME_LENGTH = 256;
const MAX_PASSWORD_LENGTH = 512;
let vaultKey = null;
let decryptedEntries = [];
let selectedBackup = null;
let toastTimer;
let resizeTimer;
let revealTimer;
let sessionTimer;
let clipboardTimer;
let clipboardSecret = null;

vaultYear.textContent = new Date().getFullYear();

function buildVaultRain() {
  const gap = window.innerWidth < 560 ? 22 : 29;
  const columns = Math.ceil(window.innerWidth / gap);
  const seed = '0100101101001010110100101011010010100101101001010110100101011010';
  vaultRain.innerHTML = '';
  for (let index = 0; index < columns; index += 1) {
    const stream = document.createElement('span');
    const shift = index % 17;
    stream.className = 'vault-stream';
    stream.textContent = `${seed.slice(shift)}${seed.slice(0, shift)}`.split('').join('\n');
    stream.style.left = `${index * gap + 4}px`;
    stream.style.setProperty('--duration', `${17 + (index % 8) * 2.2}s`);
    stream.style.setProperty('--delay', `${-(index % 14) * 1.3}s`);
    stream.style.opacity = `${0.25 + (index % 5) * 0.08}`;
    vaultRain.appendChild(stream);
  }
}

function showToast(message) {
  vaultToast.textContent = message;
  vaultToast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => vaultToast.classList.remove('is-visible'), 2600);
}

function toggleContact(open) {
  vaultContactPanel.classList.toggle('is-open', open);
  vaultMenuScrim.classList.toggle('is-visible', open);
  vaultContactPanel.setAttribute('aria-hidden', String(!open));
  vaultMenuToggle.setAttribute('aria-expanded', String(open));
  if (open) vaultMenuClose.focus(); else vaultMenuToggle.focus();
}

function toggleModal(open) {
  accountModal.hidden = !open;
  if (open) accountForm.elements.site.focus(); else accountForm.reset();
}

function togglePasswordCheck(open) {
  passwordCheckModal.hidden = !open;
  passwordCheckResult.hidden = true;
  passwordCheckResult.className = 'password-check-result';
  passwordCheckResult.textContent = '';
  if (open) passwordCheckInput.focus(); else passwordCheckForm.reset();
}

function toggleImport(open) {
  importModal.hidden = !open;
  if (!open) {
    selectedBackup = null;
    importFile.value = '';
    importFileName.textContent = t('noFileSelected');
    importForm.hidden = true;
    importForm.reset();
    importState.textContent = '';
  }
}

function showPasswordCheckResult(message, state) {
  passwordCheckResult.textContent = message;
  passwordCheckResult.className = `password-check-result is-${state}`;
  passwordCheckResult.hidden = false;
}

async function sha1Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const buffer = await crypto.subtle.digest('SHA-1', bytes);
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function togglePasswordVisibility(button) {
  const input = document.querySelector(`#${button.dataset.passwordToggle}`);
  if (!input) return;
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  button.classList.toggle('is-visible', show);
  button.setAttribute('aria-pressed', String(show));
  button.setAttribute('aria-label', t(show ? 'hidePassword' : 'showPassword'));
  input.focus();
}

function updateEntryCount(visibleEntries) {
  entryCount.textContent = String(visibleEntries.length).padStart(2, '0');
  const query = vaultSearch.value.trim();
  searchLabel.textContent = query ? t('searchResults', { count: visibleEntries.length }) : t('allAccounts');
  emptyVault.hidden = decryptedEntries.length !== 0;
  noResults.hidden = !(decryptedEntries.length && query && !visibleEntries.length);
}

function hideVaultPassword(button) {
  const card = button.closest('.vault-card');
  const secret = card?.querySelector('.secret-dots');
  if (!secret) return;
  secret.textContent = secret.dataset.mask || '••••••••••••';
  button.classList.remove('is-revealed');
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-label', t('showPassword'));
}

async function clearClipboardIfOwned() {
  if (!clipboardSecret || !navigator.clipboard?.readText || !navigator.clipboard?.writeText) return false;
  try {
    const currentValue = await navigator.clipboard.readText();
    if (currentValue !== clipboardSecret) { clipboardSecret = null; return false; }
    await navigator.clipboard.writeText('');
    clipboardSecret = null;
    showToast(t('clipboardCleared'));
    return true;
  } catch { return false; }
}

function scheduleClipboardClear() {
  window.clearTimeout(clipboardTimer);
  clipboardTimer = window.setTimeout(() => { clearClipboardIfOwned(); }, 30000);
}

function isValidEntryPayload(payload) {
  return payload && typeof payload.site === 'string' && payload.site.length > 0 && payload.site.length <= MAX_SITE_LENGTH && typeof payload.username === 'string' && payload.username.length > 0 && payload.username.length <= MAX_USERNAME_LENGTH && typeof payload.password === 'string' && payload.password.length > 0 && payload.password.length <= MAX_PASSWORD_LENGTH && (payload.url === undefined || (typeof payload.url === 'string' && payload.url.length <= 2048));
}

function getEntry(id) { return decryptedEntries.find((entry) => entry.id === id); }

function toggleVaultPassword(button) {
  if (button.classList.contains('is-revealed')) {
    window.clearTimeout(revealTimer);
    hideVaultPassword(button);
    return;
  }
  document.querySelectorAll('.reveal-password.is-revealed').forEach((activeButton) => hideVaultPassword(activeButton));
  const entry = getEntry(button.closest('.vault-card')?.dataset.id);
  const secret = button.closest('.vault-card')?.querySelector('.secret-dots');
  if (!entry || !secret) return;
  secret.dataset.mask ||= secret.textContent;
  secret.textContent = entry.password;
  button.classList.add('is-revealed');
  button.setAttribute('aria-pressed', 'true');
  button.setAttribute('aria-label', t('hidePassword'));
  window.clearTimeout(revealTimer);
  revealTimer = window.setTimeout(() => hideVaultPassword(button), 10000);
}

function makeIcon() {
  return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M2.4 12s3.4-5.5 9.6-5.5S21.6 12 21.6 12 18.2 17.5 12 17.5 2.4 12 2.4 12Z" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="2.4" stroke="currentColor" stroke-width="1.7"/></svg>';
}

function getSafeExternalUrl(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 2048) return null;
  try {
    const trimmed = value.trim();
    if (/\s/.test(trimmed) || (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^https:/i.test(trimmed))) return null;
    const candidate = /^https:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(candidate);
    const isIpv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(url.hostname);
    const isPublicHostname = /^[a-z0-9.-]+$/i.test(url.hostname) && url.hostname.includes('.') && !url.hostname.startsWith('.') && !url.hostname.endsWith('.') && !isIpv4;
    return url.protocol === 'https:' && isPublicHostname && !url.username && !url.password ? url : null;
  } catch { return null; }
}

function createCard(entry) {
  const card = document.createElement('article');
  card.className = 'vault-card';
  card.dataset.id = entry.id;
  const initials = entry.site.trim().slice(0, 2).toUpperCase() || 'CV';
  card.innerHTML = `<div class="card-mark mark-alansari"></div><div class="card-main"><div class="card-site"><h2></h2><a href="#" rel="noopener noreferrer"></a></div><p></p></div><div class="card-secret"><span class="secret-dots" aria-live="polite">••••••••••••</span><div class="card-actions"><button class="reveal-password" type="button" aria-label="${t('showPassword')}" aria-pressed="false">${makeIcon()}</button><button class="copy-password" type="button">${t('copy')}</button></div></div><span class="card-state">${t('secured')}</span>`;
  card.querySelector('.card-mark').textContent = initials;
  card.querySelector('h2').textContent = entry.site;
  const link = card.querySelector('a');
  const safeUrl = getSafeExternalUrl(entry.url);
  if (safeUrl) {
    link.href = safeUrl.href;
    link.target = '_blank';
    link.textContent = safeUrl.href.replace(/^https:\/\//i, '');
  } else {
    link.textContent = t('localEntry');
    link.onclick = (event) => event.preventDefault();
  }
  card.querySelector('.card-main p').textContent = entry.username;
  return card;
}

function renderEntries() {
  const query = vaultSearch.value.trim().toLocaleLowerCase();
  const visibleEntries = decryptedEntries.filter((entry) => !query || [entry.site, entry.username, entry.url || ''].join(' ').toLocaleLowerCase().includes(query));
  vaultList.replaceChildren(...visibleEntries.map(createCard));
  updateEntryCount(visibleEntries);
}

async function loadVault(key) {
  vaultKey = key;
  const records = await VaultStore.getEntries();
  const decrypted = await Promise.all(records.map(async (record) => {
    const payload = await VaultCrypto.decryptJSON(vaultKey, record.encrypted);
    if (!isValidEntryPayload(payload)) throw new Error('Encrypted entry payload is invalid');
    return { id: record.id, ...payload, createdAt: record.createdAt, updatedAt: record.updatedAt };
  }));
  decryptedEntries = decrypted.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  document.body.classList.remove('vault-session-pending');
  vaultSessionScreen.hidden = true;
  renderEntries();
  resetSessionTimer();
}

function resetSessionTimer() {
  if (!vaultKey) return;
  window.clearTimeout(sessionTimer);
  sessionTimer = window.setTimeout(() => lockVault(), SESSION_IDLE_MS);
}

function lockVault() {
  window.clearTimeout(sessionTimer);
  window.clearTimeout(revealTimer);
  window.clearTimeout(clipboardTimer);
  clearClipboardIfOwned();
  vaultKey = null;
  decryptedEntries = [];
  vaultList.replaceChildren();
  document.body.classList.add('vault-session-pending');
  vaultSessionScreen.hidden = false;
  if (window.parent !== window) window.parent.postMessage({ type: 'ciphervault:lock' }, window.location.origin);
  else window.location.replace('/');
}

async function saveAccount(event) {
  event.preventDefault();
  if (!vaultKey) return;
  const data = new FormData(accountForm);
  const now = new Date().toISOString();
  const payload = { site: String(data.get('site') || '').trim(), username: String(data.get('username') || '').trim(), password: String(data.get('password') || ''), url: '' };
  if (!isValidEntryPayload(payload)) { showToast(t('entryTooLarge')); return; }
  const record = { id: VaultStore.createEntryId(), encrypted: await VaultCrypto.encryptJSON(vaultKey, payload), createdAt: now, updatedAt: now };
  await VaultStore.putEntry(record);
  decryptedEntries.unshift({ id: record.id, ...payload, createdAt: now, updatedAt: now });
  accountForm.reset();
  toggleModal(false);
  vaultSearch.value = '';
  renderEntries();
  showToast(t('accountSaved'));
}

async function exportBackup() {
  try {
    const backup = await VaultStore.exportBackup();
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ciphervault-backup-${new Date().toISOString().slice(0, 10)}.cvault.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(t('backupDownloaded'));
  } catch { showToast(t('backupExportError')); }
}

async function selectImportFile(file) {
  if (!file) return;
  if (file.size > MAX_BACKUP_BYTES) {
    selectedBackup = null;
    importFileName.textContent = t('backupTooLarge');
    importForm.hidden = true;
    return;
  }
  try {
    const backup = VaultStore.validateBackup(JSON.parse(await file.text()));
    selectedBackup = backup;
    importFileName.textContent = file.name;
    importState.textContent = '';
    importForm.hidden = false;
    importMasterPassword.focus();
  } catch {
    selectedBackup = null;
    importFileName.textContent = t('invalidBackup');
    importForm.hidden = true;
  }
}

async function verifyBackupEntries(key, backup) {
  await Promise.all(backup.entries.map(async (record) => {
    const payload = await VaultCrypto.decryptJSON(key, record.encrypted);
    if (!isValidEntryPayload(payload)) throw new Error('Backup entry payload is invalid');
  }));
}

async function restoreBackup(event) {
  event.preventDefault();
  if (!selectedBackup || !importMasterPassword.value) return;
  importSubmit.disabled = true;
  importState.textContent = t('processing');
  try {
    const key = await VaultCrypto.deriveKey(importMasterPassword.value, selectedBackup.config.salt, selectedBackup.config.iterations);
    if (!await VaultCrypto.verifyKey(key, selectedBackup.config.verifier)) throw new Error('Incorrect backup password');
    await verifyBackupEntries(key, selectedBackup);
    await VaultStore.replaceFromBackup(selectedBackup);
    vaultKey = key;
    vaultSearch.value = '';
    toggleImport(false);
    await loadVault(key);
    showToast(t('backupRestored'));
  } catch {
    importMasterPassword.value = '';
    importState.textContent = t('backupPasswordError');
  } finally { importSubmit.disabled = false; }
}

vaultMenuToggle.addEventListener('click', () => toggleContact(true));
vaultMenuClose.addEventListener('click', () => toggleContact(false));
vaultMenuScrim.addEventListener('click', () => toggleContact(false));
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (!accountModal.hidden) toggleModal(false);
  if (!passwordCheckModal.hidden) togglePasswordCheck(false);
  if (!importModal.hidden) toggleImport(false);
  if (vaultContactPanel.classList.contains('is-open')) toggleContact(false);
});
document.addEventListener('pointerdown', resetSessionTimer, { passive: true });
document.addEventListener('keydown', resetSessionTimer);
document.addEventListener('click', (event) => { const button = event.target.closest('[data-password-toggle]'); if (button) togglePasswordVisibility(button); });
vaultSearch.addEventListener('input', renderEntries);
vaultList.addEventListener('click', async (event) => {
  const revealButton = event.target.closest('.reveal-password');
  if (revealButton) { toggleVaultPassword(revealButton); return; }
  const copyButton = event.target.closest('.copy-password');
  if (!copyButton) return;
  if (copyButton.dataset.clipboardPending === 'true') {
    await clearClipboardIfOwned();
    copyButton.dataset.clipboardPending = '';
    copyButton.textContent = t('copy');
    return;
  }
  const entry = getEntry(copyButton.closest('.vault-card')?.dataset.id);
  if (!entry) return;
  try {
    await navigator.clipboard.writeText(entry.password);
    clipboardSecret = entry.password;
    copyButton.dataset.clipboardPending = 'true';
    copyButton.textContent = t('clearClipboard');
    showToast(t('clipboardClearHint'));
    scheduleClipboardClear();
  } catch { showToast(t('copyUnavailable')); }
});
addAccountButton.addEventListener('click', () => toggleModal(true));
modalClose.addEventListener('click', () => toggleModal(false));
modalCancel.addEventListener('click', () => toggleModal(false));
accountModal.addEventListener('click', (event) => { if (event.target === accountModal) toggleModal(false); });
accountForm.addEventListener('submit', saveAccount);
passwordCheckButton.addEventListener('click', () => togglePasswordCheck(true));
passwordCheckClose.addEventListener('click', () => togglePasswordCheck(false));
passwordCheckCancel.addEventListener('click', () => togglePasswordCheck(false));
passwordCheckModal.addEventListener('click', (event) => { if (event.target === passwordCheckModal) togglePasswordCheck(false); });
passwordCheckForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = passwordCheckInput.value;
  if (!password) return;
  passwordCheckSubmit.disabled = true;
  passwordCheckSubmit.textContent = t('checking');
  try {
    const hash = await sha1Hex(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, { headers: { 'Add-Padding': 'true' }, cache: 'no-store' });
    if (!response.ok) throw new Error('Breach range request failed');
    const match = (await response.text()).split(/\r?\n/).find((entry) => entry.startsWith(`${suffix}:`));
    const count = match ? Number(match.split(':')[1]) : 0;
    showPasswordCheckResult(count > 0 ? t('breachFound', { count: count.toLocaleString('en-US') }) : t('breachSafe'), count > 0 ? 'breached' : 'safe');
  } catch { showPasswordCheckResult(t('breachError'), 'error'); }
  finally { passwordCheckInput.value = ''; passwordCheckSubmit.disabled = false; passwordCheckSubmit.textContent = t('checkNow'); }
});
document.querySelector('#export-button').addEventListener('click', exportBackup);
document.querySelector('#import-button').addEventListener('click', () => toggleImport(true));
importClose.addEventListener('click', () => toggleImport(false));
importCancel.addEventListener('click', () => toggleImport(false));
importModal.addEventListener('click', (event) => { if (event.target === importModal) toggleImport(false); });
importFilePicker.addEventListener('click', () => importFile.click());
importFile.addEventListener('change', () => selectImportFile(importFile.files?.[0]));
importForm.addEventListener('submit', restoreBackup);
lockVaultButton.addEventListener('click', lockVault);
document.addEventListener('ciphervault:languagechange', () => { if (vaultKey) renderEntries(); });
window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.type !== 'ciphervault:unlock') return;
  const key = event.data.key;
  // Android may expose a structured-cloned CryptoKey with a reduced shape.
  // Do not inspect realm-specific properties here; Web Crypto is the authority.
  if (!key || typeof key !== 'object') return;
  loadVault(key).catch(() => lockVault());
});
window.addEventListener('resize', () => { window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(buildVaultRain, 160); });

buildVaultRain();
if (window.parent !== window) window.parent.postMessage({ type: 'ciphervault:ready' }, window.location.origin);
else window.location.replace('/');
