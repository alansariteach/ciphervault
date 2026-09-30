let deferredInstallPrompt = null;
const isEmbeddedVault = window.parent !== window;
const installGuide = document.querySelector('#install-guide');
const installGuideClose = document.querySelector('#install-guide-close');

function showInstallGuide() {
  if (isEmbeddedVault) {
    window.parent.postMessage({ type: 'ciphervault:install' }, window.location.origin);
    return;
  }
  if (installGuide) installGuide.hidden = false;
}

async function triggerInstall() {
  if (isEmbeddedVault) {
    window.parent.postMessage({ type: 'ciphervault:install' }, window.location.origin);
    return;
  }
  if (!deferredInstallPrompt) {
    showInstallGuide();
    return;
  }
  deferredInstallPrompt.prompt();
  try { await deferredInstallPrompt.userChoice; } finally { deferredInstallPrompt = null; }
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
});
window.addEventListener('appinstalled', () => { deferredInstallPrompt = null; if (installGuide) installGuide.hidden = true; });
document.querySelectorAll('[data-install-app]').forEach((button) => button.addEventListener('click', triggerInstall));
installGuideClose?.addEventListener('click', () => { installGuide.hidden = true; });
installGuide?.addEventListener('click', (event) => { if (event.target === installGuide) installGuide.hidden = true; });
window.CipherVaultPWA = { triggerInstall };

if ('serviceWorker' in navigator && !isEmbeddedVault) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {
      // Installation remains available through the browser even if offline caching is unavailable.
    });
  });
}
