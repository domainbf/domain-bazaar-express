
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';
import { zh } from './locales/zh';

// 检测当前语言
const detectLanguage = () => {
  // 优先从localStorage获取
  const savedLanguage = localStorage.getItem('language');
  if (savedLanguage && ['zh', 'en'].includes(savedLanguage)) {
    return savedLanguage;
  }
  
  // 然后从浏览器语言检测
  const browserLanguage = navigator.language.toLowerCase();
  if (browserLanguage.startsWith('zh')) {
    return 'zh';
  }
  
  // 默认返回中文
  return 'zh';
};

// 初始化i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh }
    },
    lng: detectLanguage(),
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false,
    },
    debug: false,
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em']
    },
    // 确保翻译键不存在时返回键名而不是空字符串
    returnEmptyString: false,
    returnNull: false,
    saveMissing: false,
    missingKeyHandler: (lng, ns, key) => {
      console.warn(`Missing translation key: ${key} for language: ${lng}`);
      return key;
    }
  });

export default i18n;

export const changeLanguage = async (language: string) => {
  try {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    
    await i18n.changeLanguage(language);
    
    // 立即更新页面标题
    if (language === 'zh') {
      document.title = 'NIC.BN - 域名交易平台';
    } else {
      document.title = 'NIC.BN - Domain Marketplace';
    }
    
    // 触发页面重新渲染
    window.dispatchEvent(new Event('languageChanged'));
    
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to change language:', error);
    return Promise.reject(error);
  }
};
