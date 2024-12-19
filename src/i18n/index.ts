import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      title: 'Premium Domain Names',
      subtitle: 'Selected rare short domains waiting for your offer',
      all: 'All',
      available: 'Available',
      sold: 'Sold',
      makeOffer: 'Make Offer',
      yourOffer: 'Your Offer (USD)',
      contactEmail: 'Contact Email',
      submit: 'Submit Offer',
      offerSuccess: 'Offer submitted! We will contact you soon.',
    },
  },
  zh: {
    translation: {
      title: '优质域名展示',
      subtitle: '精选稀有短域名，等待您的报价',
      all: '全部',
      available: '可售',
      sold: '已售',
      makeOffer: '提交报价',
      yourOffer: '您的报价 (USD)',
      contactEmail: '联系邮箱',
      submit: '提交报价',
      offerSuccess: '报价已提交! 我们会尽快联系您。',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;