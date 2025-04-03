
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      title: 'NIC.BN - Premium Domain Names',
      subtitle: 'Selected rare short domains waiting for your offer',
      all: 'All',
      available: 'Available',
      sold: 'Sold',
      makeOffer: 'Make Offer',
      yourOffer: 'Your Offer (USD)',
      contactEmail: 'Contact Email',
      submit: 'Submit Offer',
      submitting: 'Submitting...',
      offerSuccess: 'Offer submitted! We will contact you soon.',
      offerError: 'Error submitting offer. Please try again.',
      offerDescription: 'Submit your offer for this premium domain. We\'ll review and contact you shortly.',
      premiumDomains: 'Premium Domains',
      premiumDomainsDesc: 'Exclusive premium domain names for your brand',
      shortDomains: 'Short Domains',
      shortDomainsDesc: 'Ultra-short domain names for maximum impact',
      specialDomains: 'Special Domains',
      specialDomainsDesc: 'Unique domain names with special characteristics',
      allDomains: 'All Available Domains',
      allDomainsDesc: 'Browse our complete collection of premium domain names',
      soldDomains: 'Recently Sold',
      soldDomainsDesc: 'Domain names that have found their perfect match',
    },
  },
  zh: {
    translation: {
      title: 'NIC.BN - 优质域名交易中心',
      subtitle: '精选稀有短域名，等待您的报价',
      all: '全部',
      available: '可售',
      sold: '已售',
      makeOffer: '提交报价',
      yourOffer: '您的报价 (USD)',
      contactEmail: '联系邮箱',
      submit: '提交报价',
      submitting: '提交中...',
      offerSuccess: '报价已提交! 我们会尽快联系您。',
      offerError: '提交报价时出错，请重试。',
      offerDescription: '提交您对这个优质域名的报价，我们将尽快审核并与您联系。',
      premiumDomains: '优质域名',
      premiumDomainsDesc: '为您的品牌提供的专属优质域名',
      shortDomains: '短域名',
      shortDomainsDesc: '超短域名，创造最大影响力',
      specialDomains: '特色域名',
      specialDomainsDesc: '具有特殊特征的独特域名',
      allDomains: '所有可用域名',
      allDomainsDesc: '浏览我们完整的优质域名集合',
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
