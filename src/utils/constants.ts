
export const APP_CONFIG = {
  name: 'DomainMarket',
  description: '专业的域名交易平台',
  version: '1.0.0',
  contact: {
    email: 'support@domainmarket.com',
    phone: '+86-400-123-4567'
  },
  features: {
    enableRegistration: true,
    enableNotifications: true,
    enableRealtime: true
  }
} as const;

export const API_ENDPOINTS = {
  domains: '/domain_listings',
  offers: '/domain_offers',
  analytics: '/domain_analytics',
  notifications: '/notifications',
  profiles: '/profiles'
} as const;

export const DOMAIN_CATEGORIES = [
  { value: 'premium', label: '优质域名', description: '高价值精品域名' },
  { value: 'short', label: '短域名', description: '简短易记域名' },
  { value: 'standard', label: '标准域名', description: '常规域名' },
  { value: 'dev', label: '开发域名', description: '技术开发相关' }
] as const;

export const DOMAIN_STATUSES = [
  { value: 'available', label: '可售', color: 'green' },
  { value: 'pending', label: '审核中', color: 'yellow' },
  { value: 'sold', label: '已售', color: 'blue' },
  { value: 'reserved', label: '保留', color: 'gray' }
] as const;

export const VERIFICATION_STATUSES = [
  { value: 'verified', label: '已验证', color: 'green' },
  { value: 'pending', label: '待验证', color: 'yellow' },
  { value: 'rejected', label: '验证失败', color: 'red' }
] as const;

export const PRICE_RANGES = [
  { min: 0, max: 1000, label: '¥1,000以下' },
  { min: 1000, max: 5000, label: '¥1,000 - ¥5,000' },
  { min: 5000, max: 10000, label: '¥5,000 - ¥10,000' },
  { min: 10000, max: 50000, label: '¥10,000 - ¥50,000' },
  { min: 50000, max: 100000, label: '¥50,000 - ¥100,000' },
  { min: 100000, max: null, label: '¥100,000以上' }
] as const;
