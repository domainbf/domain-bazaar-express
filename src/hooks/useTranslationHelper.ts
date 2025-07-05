
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export const useTranslationHelper = () => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // 确保组件在语言切换后重新渲染
    const handleLanguageChange = () => {
      // 强制重新渲染
      window.dispatchEvent(new Event('resize'));
    };

    // 监听语言变化事件
    i18n.on('languageChanged', handleLanguageChange);
    window.addEventListener('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const getTranslation = (key: string, defaultValue?: string) => {
    try {
      const translation = t(key, defaultValue);
      
      // 如果翻译键不存在且没有默认值，返回键名的最后一部分
      if (translation === key && !defaultValue) {
        const parts = key.split('.');
        return parts[parts.length - 1];
      }
      
      return translation;
    } catch (error) {
      console.error('Translation error for key:', key, error);
      return defaultValue || key;
    }
  };

  return {
    t: getTranslation,
    i18n,
    currentLanguage: i18n.language,
    isChineseLanguage: i18n.language === 'zh'
  };
};
