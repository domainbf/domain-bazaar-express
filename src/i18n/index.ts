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
      premiumDomains: 'Premium Domains',
      premiumDomainsDesc: 'Exclusive premium domain names for your brand',
      shortDomains: 'Short Domains',
      shortDomainsDesc: 'Ultra-short domain names for maximum impact',
      specialDomains: 'Special Domains',
      specialDomainsDesc: 'Unique domain names with special characteristics',
      otherDomains: 'Featured Domains',
      otherDomainsDesc: 'More excellent domain names for your choice',
      soldDomains: 'Recently Sold',
      soldDomainsDesc: 'Domain names that have found their perfect match',
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
      premiumDomains: '优质域名',
      premiumDomainsDesc: '为您的品牌提供的专属优质域名',
      shortDomains: '短域名',
      shortDomainsDesc: '超短域名，创造最大影响力',
      specialDomains: '特色域名',
      specialDomainsDesc: '具有特殊特征的独特域名',
      otherDomains: '精选域名',
      otherDomainsDesc: '更多优秀域名供您选择',
      soldDomains: '近期售出',
      soldDomainsDesc: '已找到完美归宿的域名',
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