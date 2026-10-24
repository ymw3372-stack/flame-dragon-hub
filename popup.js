
const file = document.getElementById('file');
const msg = document.getElementById('msg');
const preview = document.getElementById('preview');
const skinName = document.getElementById('skinName');
const languagePicker = document.getElementById('language');
const clearButton = document.getElementById('clear');

const translations = {
  en: {
    subtitle: 'Skin Bridge · Prototype',
    languageLabel: 'Language',
    intro: 'Load a JSON skin bundle exported from Skin Studio.',
    import: 'Import skin bundle',
    none: 'No bundle loaded',
    loaded: 'Bundle loaded in extension',
    clear: 'Clear saved skin',
    note: 'This bridge transfers the design to the extension and can preview it locally. It does not yet replace the in-game avatar.',
    choose: 'Choose a JSON file exported by Skin Studio.',
    error: 'Could not read this bundle.',
    custom: 'Custom skin',
    body: 'Custom body'
  },
  ar: {
    subtitle: 'جسر السكنات · نسخة تجريبية',
    languageLabel: 'اللغة',
    intro: 'حمّل ملف سكن JSON تم تصديره من Skin Studio.',
    import: 'استيراد ملف السكن',
    none: 'لم يتم تحميل أي ملف',
    loaded: 'تم تحميل الملف في الإضافة',
    clear: 'مسح السكن المحفوظ',
    note: 'تنقل هذه الأداة التصميم إلى الإضافة وتتيح معاينته محليًا. لكنها لا تستبدل شخصية اللعبة حتى الآن.',
    choose: 'اختر ملف JSON صادرًا من Skin Studio.',
    error: 'تعذرت قراءة الملف.',
    custom: 'سكن مخصص',
    body: 'جسم مخصص'
  },
  ru: {
    subtitle: 'Skin Bridge · Прототип',
    languageLabel: 'Язык',
    intro: 'Загрузите JSON-файл скина из Skin Studio.',
    import: 'Импортировать скин',
    none: 'Скин не загружен',
    loaded: 'Файл загружен в расширение',
    clear: 'Удалить сохранённый скин',
    note: 'Инструмент передаёт дизайн расширению и позволяет просматривать его локально. Замена игрового персонажа пока не поддерживается.',
    choose: 'Выберите JSON-файл, экспортированный из Skin Studio.',
    error: 'Не удалось прочитать файл.',
    custom: 'Собственный скин',
    body: 'Собственное тело'
  },
  de: {
    subtitle: 'Skin Bridge · Prototyp',
    languageLabel: 'Sprache',
    intro: 'Lade ein aus Skin Studio exportiertes JSON-Skinpaket.',
    import: 'Skinpaket importieren',
    none: 'Kein Paket geladen',
    loaded: 'Paket in der Erweiterung geladen',
    clear: 'Gespeicherten Skin löschen',
    note: 'Dieses Tool überträgt das Design an die Erweiterung und zeigt eine lokale Vorschau. Der Spielcharakter wird noch nicht ersetzt.',
    choose: 'Wähle eine aus Skin Studio exportierte JSON-Datei.',
    error: 'Die Datei konnte nicht gelesen werden.',
    custom: 'Benutzerdefinierter Skin',
    body: 'Benutzerdefinierter Körper'
  },
  hi: {
    subtitle: 'स्किन ब्रिज · प्रोटोटाइप',
    languageLabel: 'भाषा',
    intro: 'Skin Studio से एक्सपोर्ट की गई JSON स्किन फ़ाइल लोड करें।',
    import: 'स्किन फ़ाइल इम्पोर्ट करें',
    none: 'कोई फ़ाइल लोड नहीं हुई',
    loaded: 'फ़ाइल एक्सटेंशन में लोड हो गई',
    clear: 'सेव की गई स्किन हटाएँ',
    note: 'यह टूल डिज़ाइन को एक्सटेंशन में भेजता है और स्थानीय प्रीव्यू दिखाता है। यह अभी गेम के कैरेक्टर को नहीं बदलता।',
    choose: 'Skin Studio से एक्सपोर्ट की गई JSON फ़ाइल चुनें।',
    error: 'फ़ाइल पढ़ी नहीं जा सकी।',
    custom: 'कस्टम स्किन',
    body: 'कस्टम बॉडी'
  }
};

let currentLanguage = 'en';
let currentBundle = null;

function t(key) {
  return translations[currentLanguage][key] || translations.en[key] || key;
}

function applyLanguage(language) {
  currentLanguage = translations[language] ? language : 'en';
  document.documentElement.lang = currentLanguage;
  document.body.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-i18n]').forEach(element => {
    element.textContent = t(element.dataset.i18n);
  });

  languagePicker.value = currentLanguage;
  renderBundle(currentBundle);
}

function renderBundle(bundle) {
  currentBundle = bundle || null;

  if (!currentBundle) {
    msg.textContent = t('none');
    preview.hidden = true;
    preview.removeAttribute('src');
    skinName.textContent = '';
    return;
  }

  msg.textContent = t('loaded');
  preview.src = currentBundle.image;
  preview.hidden = false;
  preview.alt = t('custom');

  skinName.textContent =
    (currentBundle.name || t('custom')) +
    ' · ' +
    (currentBundle.body || t('body'));
}

chrome.storage.local.get(['skinBundle', 'fdhLanguage'], result => {
  const savedLanguage = result.fdhLanguage || 'en';
  applyLanguage(savedLanguage);
  renderBundle(result.skinBundle || null);
});

languagePicker.addEventListener('change', async () => {
  const language = languagePicker.value;
  applyLanguage(language);

  try {
    await chrome.storage.local.set({ fdhLanguage: language });
  } catch (error) {
    console.error('Could not save language preference:', error);
  }
});

file.addEventListener('change', async () => {
  const selectedFile = file.files && file.files[0];
  if (!selectedFile) return;

  try {
    const data = JSON.parse(await selectedFile.text());

    if (
      data.format !== 'flame-dragon-skin' ||
      typeof data.image !== 'string' ||
      !data.image.startsWith('data:image/')
    ) {
      throw new Error('INVALID_SKIN_FILE');
    }

    await chrome.storage.local.set({ skinBundle: data });
    renderBundle(data);
  } catch (error) {
    msg.textContent =
      error.message === 'INVALID_SKIN_FILE'
        ? t('choose')
        : t('error');
  }
});

clearButton.addEventListener('click', async () => {
  try {
    await chrome.storage.local.remove('skinBundle');
    renderBundle(null);
    file.value = '';
  } catch (error) {
    msg.textContent = t('error');
  }
});
