(() => {
  const storageKey = 'ciphervault-language';
  const translations = {
    ar: {
      languageLabel: 'EN', languageAction: 'Switch to English', languageMenu: 'التحويل الى الانجليزية', menuOpen: 'فتح القائمة', menuClose: 'إغلاق القائمة',
      contactTitle: 'تواصل معنا', contactCopy: 'للاستفسارات والدعم، تواصل مباشرة عبر Telegram وInstagram.', personalMark: 'الشعار الشخصي',
      attemptsNotice: 'التشفير محلي على جهازك فقط.', masterPassword: 'كلمة المرور الرئيسية', masterPlaceholder: 'أدخل كلمة المرور الرئيسية', confirmMaster: 'تأكيد كلمة المرور الرئيسية', confirmPlaceholder: 'أعد إدخال كلمة المرور',
      showMaster: 'إظهار كلمة المرور الرئيسية', hideMaster: 'إخفاء كلمة المرور', openVault: 'فتح الخزنة', createVault: 'إنشاء الخزنة', processing: 'جار التشفير…', loadingVault: 'جار تجهيز الخزنة المحلية…', createVaultNote: 'أنشئ كلمة مرور رئيسية من 12 حرفا على الأقل. لا يمكن استعادتها إذا نسيتها.', unlockVaultNote: 'أدخل كلمة المرور الرئيسية لفك خزنتك على هذا الجهاز.',
      securityDescription: 'تظل بياناتك مشفرة محليا على هذا الجهاز. بعد 3 محاولات خاطئة يقفل.', localOnly: 'AES-256 / محلي فقط', attemptsMax: '٣ محاولات كحد أقصى',
      biometricUnlock: 'فتح بالبصمة', biometricUnlockHint: 'متاح على هذا الجهاز بعد التفعيل بكلمة المرور الرئيسية.', biometricPrompt: 'تحقق بالبصمة مطلوب…', biometricUnlockFailed: 'تعذر فتح الخزنة بالبصمة. استخدم كلمة المرور الرئيسية.', biometricSetup: 'تفعيل البصمة لهذا الجهاز', biometricSetupTitle: 'تفعيل فتح الخزنة بالبصمة', biometricSetupIntro: 'أدخل كلمة المرور الرئيسية للتأكيد. سيطلب الجهاز Face ID أو بصمة الإصبع إن كانت متاحة.', biometricSetupAvailable: 'يمكن تفعيل Face ID أو بصمة الإصبع لهذا الجهاز.', biometricSetupUnavailable: 'البصمة غير مدعومة في هذا المتصفح أو الجهاز.', biometricEnabled: 'فتح بالبصمة مفعل على هذا الجهاز.', biometricSetupSuccess: 'تم تفعيل فتح الخزنة بالبصمة على هذا الجهاز.', biometricSetupError: 'تعذر تفعيل البصمة. تأكد من كلمة المرور الرئيسية ودعم الجهاز.', biometricConfirm: 'تأكيد وتفعيل البصمة',
      madeBy: 'صنع بواسطة Alansari.Tech', vaultTitle: 'الخزنة <span>مفتوحة</span>', vaultDescription: 'إدارة وصولك المشفر من جهازك الحالي.',
      vaultStatus: 'حالة الخزنة', unlocked: 'مفتوحة', lockVault: 'قفل الخزنة <i aria-hidden="true">↵</i>', vaultTools: 'أدوات الخزنة',
      searchPlaceholder: 'ابحث بالاسم، المستخدم أو الرابط', passwordCheck: 'فحص كلمة المرور', import: 'استيراد', export: 'تصدير', addAccount: 'إضافة حساب',
      encryptedEntries: 'الحسابات المشفرة', allAccounts: 'جميع الحسابات', noResults: 'لا توجد حسابات مطابقة للبحث.', secured: 'محمي', protectionStatus: 'حالة الحماية',
      vaultCipher: 'تشفير الخزنة', accessLimit: 'حد المحاولات', autoLock: 'قفل تلقائي', storage: 'التخزين', tries: '٣ محاولات', local: 'محلي',
      securityNote: 'لا تغادر أي بيانات هذا الجهاز في النسخة النهائية من الخزنة.', newEncryptedEntry: 'سجل مشفر جديد', addAccountTitle: 'إضافة حساب',
      siteOrApp: 'الموقع أو التطبيق', sitePlaceholder: 'Notion', username: 'اسم المستخدم', password: 'كلمة المرور', passwordPlaceholder: 'أدخل كلمة المرور',
      cancel: 'إلغاء', saveAccount: 'حفظ الحساب', privacyLeakCheck: 'فحص تسريبات يحافظ على الخصوصية', leakCheckTitle: 'فحص كلمة المرور',
      leakPrivacy: 'لا ترسل كلمة المرور ولا الهاش الكامل. ننشئ الهاش داخل جهازك ونرسل أول ٥ أحرف منه فقط إلى خدمة Pwned Passwords للفحص.',
      checkNow: 'افحص الآن', showPassword: 'إظهار كلمة المرور', hidePassword: 'إخفاء كلمة المرور', copy: 'نسخ', copied: 'تم النسخ', clearClipboard: 'مسح الحافظة', clipboardClearHint: 'نقلت كلمة المرور خارج الخزنة. اضغط مسح الحافظة أو ستتم محاولة مسحها تلقائيا بعد 30 ثانية.', clipboardCleared: 'تم مسح الحافظة إذا كانت ما زالت تحتوي كلمة المرور.',
      masterEmpty: 'أدخل كلمة المرور الرئيسية للمتابعة.', masterTooShort: 'استخدم كلمة مرور رئيسية من 12 إلى 256 حرفا.', passwordMismatch: 'كلمتا المرور غير متطابقتين.', vaultCreateError: 'تعذر إنشاء الخزنة المحلية. حاول مرة أخرى.', storageUnavailable: 'لا يتوفر تخزين محلي آمن في هذا المتصفح.', vaultLocked: 'الخزنة مقفلة مؤقتا.', vaultLockedUntil: 'تم قفل الخزنة مؤقتا بعد 3 محاولات غير صحيحة.', wrongAttempt: 'كلمة مرور غير صحيحة — المحاولة {count} من 3.',
      searchResults: '{count} نتائج مطابقة', passwordCopied: 'تم نسخ كلمة المرور إلى الحافظة.', copyUnavailable: 'تعذر النسخ تلقائيا في هذا المتصفح.',
      accountSaved: 'تم تشفير الحساب وحفظه محليا.', entryTooLarge: 'أحد حقول الحساب طويل جدا أو غير صالح.', backupTooLarge: 'ملف النسخة الاحتياطية أكبر من الحد المسموح (10 MB).', checking: 'جار الفحص...', breachFound: 'تحذير: ظهرت كلمة المرور ضمن التسريبات المفهرسة {count} مرة. غيرها فورا ولا تستخدمها في أي حساب.',
      breachSafe: 'لم تظهر كلمة المرور ضمن قاعدة التسريبات المفهرسة. هذا لا يضمن أنها قوية؛ استخدم كلمة طويلة وفريدة لكل حساب.', breachError: 'تعذر الاتصال بخدمة فحص التسريبات حاليا. أعد المحاولة لاحقا.',
      backupDownloaded: 'تم تنزيل النسخة الاحتياطية المشفرة.', backupExportError: 'تعذر إنشاء النسخة الاحتياطية.', backupRestored: 'تم التحقق من النسخة واستعادتها محليا.', invalidBackup: 'ملف النسخة غير صالح أو غير مدعوم.', backupPasswordError: 'كلمة مرور النسخة غير صحيحة أو تعذر استعادتها.', vaultLockedToast: 'تم قفل الخزنة.', localEntry: 'سجل محلي', emptyVault: 'الخزنة فارغة. أضف أول حساب مشفر.',
      importVaultTitle: 'استيراد نسخة مشفرة', importVaultIntro: 'اختر ملف CipherVault مشفرا. لن تستعاد أي بيانات قبل التحقق من كلمة المرور الرئيسية للنسخة.', chooseBackup: 'اختيار ملف النسخة', noFileSelected: 'لم يتم اختيار ملف.', backupMasterPassword: 'كلمة مرور النسخة', backupMasterPlaceholder: 'أدخل كلمة المرور الرئيسية للنسخة', restoreBackup: 'استعادة النسخة', sessionWaiting: 'جار تهيئة جلسة الخزنة المشفرة…',
      installApp: 'تثبيت التطبيق', installGuideTitle: 'تثبيت CipherVault', installGuideIntro: 'على iPhone، افتح هذا الموقع في Safari ثم اتبع الخطوات التالية:', installGuideSteps: '<li>اضغط زر المشاركة Share.</li><li>اختر Add to Home Screen.</li><li>اضغط Add لتثبيت CipherVault.</li>',
      indexTitle: 'CIPHERVAULT | وصول آمن', vaultPageTitle: 'CIPHERVAULT | الخزنة'
    },
    en: {
      languageLabel: 'ع', languageAction: 'التبديل إلى العربية', languageMenu: 'Switch to Arabic', menuOpen: 'Open menu', menuClose: 'Close menu',
      contactTitle: 'Contact us', contactCopy: 'For enquiries and support, contact us directly through Telegram and Instagram.', personalMark: 'Personal mark',
      attemptsNotice: 'Encryption stays local to this device.', masterPassword: 'MASTER PASSWORD', masterPlaceholder: 'Enter the master password', confirmMaster: 'CONFIRM MASTER PASSWORD', confirmPlaceholder: 'Enter the password again',
      showMaster: 'Show master password', hideMaster: 'Hide password', openVault: 'OPEN VAULT', createVault: 'CREATE VAULT', processing: 'ENCRYPTING…', loadingVault: 'Preparing the local vault…', createVaultNote: 'Create a master password with at least 12 characters. It cannot be recovered if forgotten.', unlockVaultNote: 'Enter the master password to decrypt this vault on this device.',
      securityDescription: 'Your data stays encrypted locally on this device. After 3 incorrect attempts, the vault locks.', localOnly: 'AES-256 / LOCAL ONLY', attemptsMax: '03 ATTEMPTS MAX',
      biometricUnlock: 'UNLOCK WITH BIOMETRICS', biometricUnlockHint: 'Available on this device after master-password setup.', biometricPrompt: 'Biometric verification required…', biometricUnlockFailed: 'Biometric unlock was unavailable. Use the master password.', biometricSetup: 'ENABLE BIOMETRIC UNLOCK', biometricSetupTitle: 'Enable biometric unlock', biometricSetupIntro: 'Enter the master password to confirm. Your device will request Face ID, fingerprint, or its available biometric method.', biometricSetupAvailable: 'Face ID or fingerprint can be enabled on this device.', biometricSetupUnavailable: 'Biometric unlock is not supported by this browser or device.', biometricEnabled: 'Biometric unlock is enabled on this device.', biometricSetupSuccess: 'Biometric unlock is enabled for this device.', biometricSetupError: 'Could not enable biometrics. Check the master password and device support.', biometricConfirm: 'CONFIRM AND ENABLE BIOMETRICS',
      madeBy: 'Made by Alansari.Tech', vaultTitle: 'VAULT <span>UNLOCKED</span>', vaultDescription: 'Manage your encrypted access from this device.',
      vaultStatus: 'VAULT STATUS', unlocked: 'UNLOCKED', lockVault: 'LOCK VAULT <i aria-hidden="true">↵</i>', vaultTools: 'Vault tools',
      searchPlaceholder: 'Search by name, user, or URL', passwordCheck: 'PASSWORD CHECK', import: 'IMPORT', export: 'EXPORT', addAccount: 'ADD ACCOUNT',
      encryptedEntries: 'ENCRYPTED ENTRIES', allAccounts: 'All accounts', noResults: 'No accounts match this search.', secured: 'SECURED', protectionStatus: 'PROTECTION STATUS',
      vaultCipher: 'VAULT CIPHER', accessLimit: 'ACCESS LIMIT', autoLock: 'AUTO LOCK', storage: 'STORAGE', tries: '03 TRIES', local: 'LOCAL',
      securityNote: 'No data leaves this device in the final vault version.', newEncryptedEntry: 'NEW ENCRYPTED ENTRY', addAccountTitle: 'Add account',
      siteOrApp: 'Website or app', sitePlaceholder: 'Notion', username: 'Username', password: 'Password', passwordPlaceholder: 'Enter password',
      cancel: 'Cancel', saveAccount: 'Save account', privacyLeakCheck: 'PRIVACY-PRESERVING LEAK CHECK', leakCheckTitle: 'Password check',
      leakPrivacy: 'Your password and its full hash are never sent. The hash is created on your device; only its first 5 characters are sent to Pwned Passwords for checking.',
      checkNow: 'CHECK NOW', showPassword: 'Show password', hidePassword: 'Hide password', copy: 'COPY', copied: 'COPIED', clearClipboard: 'CLEAR CLIPBOARD', clipboardClearHint: 'The password is outside the vault. Clear it now, or the app will try to clear it after 30 seconds.', clipboardCleared: 'Clipboard cleared if it still contained the copied password.',
      masterEmpty: 'Enter the master password to continue.', masterTooShort: 'Use a master password with 12 to 256 characters.', passwordMismatch: 'The passwords do not match.', vaultCreateError: 'Unable to create the local vault. Please try again.', storageUnavailable: 'Secure local storage is unavailable in this browser.', vaultLocked: 'Vault temporarily locked.', vaultLockedUntil: 'Vault temporarily locked after 3 incorrect attempts.', wrongAttempt: 'Incorrect password — attempt {count} of 3.',
      searchResults: '{count} matching results', passwordCopied: 'Password copied to clipboard.', copyUnavailable: 'Automatic copy is unavailable in this browser.',
      accountSaved: 'Account encrypted and saved locally.', entryTooLarge: 'An account field is too long or invalid.', backupTooLarge: 'The backup file exceeds the 10 MB limit.', checking: 'CHECKING…', breachFound: 'Warning: this password appears in indexed breaches {count} times. Change it now and do not use it for any account.',
      breachSafe: 'This password does not appear in the indexed breach database. That does not guarantee strength; use a long, unique password for every account.', breachError: 'Unable to reach the breach-check service right now. Please try again later.',
      backupDownloaded: 'Encrypted backup downloaded.', backupExportError: 'Unable to create the encrypted backup.', backupRestored: 'Backup verified and restored locally.', invalidBackup: 'Backup file is invalid or unsupported.', backupPasswordError: 'Backup password is incorrect or restore failed.', vaultLockedToast: 'Vault locked.', localEntry: 'local entry', emptyVault: 'Your vault is empty. Add the first encrypted account.',
      importVaultTitle: 'Import encrypted backup', importVaultIntro: 'Choose an encrypted CipherVault file. No data is restored before its master password is verified.', chooseBackup: 'Choose backup file', noFileSelected: 'No file selected.', backupMasterPassword: 'BACKUP MASTER PASSWORD', backupMasterPlaceholder: 'Enter the backup master password', restoreBackup: 'Restore backup', sessionWaiting: 'Preparing encrypted vault session…',
      installApp: 'INSTALL APP', installGuideTitle: 'Install CipherVault', installGuideIntro: 'On iPhone, open this website in Safari and follow these steps:', installGuideSteps: '<li>Tap the Share button.</li><li>Choose Add to Home Screen.</li><li>Tap Add to install CipherVault.</li>',
      indexTitle: 'CIPHERVAULT | Secure Access', vaultPageTitle: 'CIPHERVAULT | Vault'
    }
  };

  const getLanguage = () => document.documentElement.lang === 'en' ? 'en' : 'ar';
  const t = (key, variables = {}) => {
    let value = translations[getLanguage()][key] ?? translations.ar[key] ?? key;
    Object.entries(variables).forEach(([name, replacement]) => { value = value.replaceAll(`{${name}}`, String(replacement)); });
    return value;
  };

  function applyLanguage(language) {
    const selected = language === 'en' ? 'en' : 'ar';
    document.documentElement.lang = selected;
    document.documentElement.dir = selected === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach((element) => { element.textContent = t(element.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach((element) => { element.innerHTML = t(element.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => { element.placeholder = t(element.dataset.i18nPlaceholder); });
    document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => { element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel)); });
    document.querySelectorAll('[data-i18n-alt]').forEach((element) => { element.alt = t(element.dataset.i18nAlt); });
    document.querySelectorAll('[data-language-toggle-label]').forEach((element) => { element.textContent = t('languageLabel'); });
    document.querySelectorAll('[data-language-toggle]').forEach((element) => { element.setAttribute('aria-label', t('languageAction')); });
    const titleKey = document.body.dataset.pageTitle;
    if (titleKey) document.title = t(titleKey);
    try { localStorage.setItem(storageKey, selected); } catch { /* Storage can be unavailable in a private preview. */ }
    document.dispatchEvent(new CustomEvent('ciphervault:languagechange', { detail: { language: selected } }));
  }

  function toggleLanguage() { applyLanguage(getLanguage() === 'ar' ? 'en' : 'ar'); }

  window.CipherVaultLanguage = { t, getLanguage, applyLanguage, toggleLanguage };
  document.querySelectorAll('[data-language-toggle]').forEach((button) => button.addEventListener('click', toggleLanguage));
  let storedLanguage = 'ar';
  try { storedLanguage = localStorage.getItem(storageKey) || 'ar'; } catch { /* Use Arabic as the default. */ }
  applyLanguage(storedLanguage);
})();
