
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
    // Add these options for better handling
    react: {
      useSuspense: false, // Prevents suspense issues
    },
    // Add retry behavior for failed loads
    retry: true,
    // Improve caching behavior
    load: 'currentOnly',
  });

export default i18n;

export const changeLanguage = (language: string) => {
  try {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    return i18n.changeLanguage(language);
  } catch (error) {
    console.error('Failed to change language:', error);
    return Promise.reject(error);
  }
};
