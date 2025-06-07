
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';
import { zh } from './locales/zh';

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en
      },
      zh: {
        translation: zh
      }
    },
    lng: localStorage.getItem('language') || 'zh',
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
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i']
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
    
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to change language:', error);
    return Promise.reject(error);
  }
};
