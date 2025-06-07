
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

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const getTranslation = (key: string, defaultValue?: string) => {
    const translation = t(key, defaultValue);
    // 如果翻译键不存在且没有默认值，返回键名的最后一部分
    if (translation === key && !defaultValue) {
      const parts = key.split('.');
      return parts[parts.length - 1];
    }
    return translation;
  };

  return {
    t: getTranslation,
    i18n,
    currentLanguage: i18n.language,
    isChineseLanguage: i18n.language === 'zh'
  };
};
