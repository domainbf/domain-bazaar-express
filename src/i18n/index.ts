
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
    // Add debug in development mode
    debug: process.env.NODE_ENV === 'development',
    react: {
      useSuspense: false, // Prevents suspense issues
      bindI18n: 'languageChanged', // Re-render on language change
      bindI18nStore: 'added removed', // Re-render on store changes
    }
  });

export default i18n;

export const changeLanguage = async (language: string) => {
  try {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr'); // Support for RTL languages in the future
    
    // Change language and wait for it to complete
    await i18n.changeLanguage(language);
    
    // Force re-render of all components by dispatching a custom event
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }));
    
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to change language:', error);
    return Promise.reject(error);
  }
};
