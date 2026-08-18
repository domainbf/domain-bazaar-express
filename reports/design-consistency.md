# 页面风格一致性报告

生成时间: 2026-08-18T04:38:46.936Z
扫描文件: 318　问题总数: **70**

## 按规则汇总

| 规则 | 说明 | 数量 |
| --- | --- | --- |
| `palette-color` | 硬编码调色板颜色（应改用语义 token） | 0 |
| `arbitrary-color` | 任意值颜色 bg-[#...] / text-[#...] | 0 |
| `absolute-bw` | text-white / bg-white / bg-black / text-black | 17 |
| `container-width` | 容器宽度偏离 page-container(max-w-6xl) | 42 |
| `heading-scale` | 标题字号偏离层级（text-4xl+ 未走 Hero/section-title） | 5 |
| `card-radius` | 卡片圆角偏离（rounded-3xl / rounded-[..]） | 0 |
| `raw-shadow` | 原生阴影（应使用 shadow-card / shadow-elegant） | 2 |
| `inline-hex` | 内联样式中的十六进制颜色 | 4 |

## 按页面区域汇总

| 区域 | 数量 |
| --- | --- |
| 页面 | 32 |
| 通用组件 | 15 |
| 首页区块 | 10 |
| 后台管理 | 8 |
| 域名市场 | 2 |
| 用户中心 | 2 |
| 域名详情 | 1 |

## Top 25 待整改文件

| 文件 | 数量 |
| --- | --- |
| `src/components/pwa/PWAInstallBanner.tsx` | 8 |
| `src/pages/SellDomain.tsx` | 5 |
| `src/components/admin/AdminTransactionManagement.tsx` | 4 |
| `src/pages/UserProfile.tsx` | 4 |
| `src/pages/AuctionsPage.tsx` | 3 |
| `src/pages/SellerPage.tsx` | 3 |
| `src/components/marketplace/DomainListings.tsx` | 2 |
| `src/components/payment/MultiCurrencyPayment.tsx` | 2 |
| `src/components/sections/HeroSection.tsx` | 2 |
| `src/components/sections/TrendingDomains.tsx` | 2 |
| `src/components/sell/SellDomainQuickListForm.tsx` | 2 |
| `src/components/Navbar.tsx` | 1 |
| `src/components/admin/AdminFeedback.tsx` | 1 |
| `src/components/admin/AdminLogoManagement.tsx` | 1 |
| `src/components/admin/SiteSettings.tsx` | 1 |
| `src/components/domain/DomainDetailPage.tsx` | 1 |
| `src/components/payment/PaymentIntegration.tsx` | 1 |
| `src/components/search/AdvancedSearchFilters.tsx` | 1 |
| `src/components/sections/ContactSection.tsx` | 1 |
| `src/components/sections/DealsShowcaseSection.tsx` | 1 |
| `src/components/sections/DomainShowcaseTabs.tsx` | 1 |
| `src/components/sections/FeaturesSection.tsx` | 1 |
| `src/components/sections/SoldDomains.tsx` | 1 |
| `src/components/sections/StatsSection.tsx` | 1 |
| `src/components/usercenter/ProfileSettings.tsx` | 1 |

## 明细（前 300 条）

| 文件:行 | 规则 | 片段 |
| --- | --- | --- |
| `src/components/Navbar.tsx:183` | container-width | `max-w-7xl` |
| `src/components/admin/AdminFeedback.tsx:95` | absolute-bw | `bg-black` |
| `src/components/admin/AdminLogoManagement.tsx:435` | absolute-bw | `bg-white` |
| `src/components/admin/AdminTransactionManagement.tsx:164` | inline-hex | `color: '#0f172a` |
| `src/components/admin/AdminTransactionManagement.tsx:220` | inline-hex | `color: '#7c3aed` |
| `src/components/admin/AdminTransactionManagement.tsx:268` | inline-hex | `color: '#16a34a` |
| `src/components/admin/AdminTransactionManagement.tsx:355` | inline-hex | `color: '#f97316` |
| `src/components/admin/SiteSettings.tsx:1459` | absolute-bw | `bg-white` |
| `src/components/domain/DomainDetailPage.tsx:525` | raw-shadow | `shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.15)]` |
| `src/components/marketplace/DomainListings.tsx:48` | heading-scale | `text-7xl` |
| `src/components/marketplace/DomainListings.tsx:49` | heading-scale | `text-6xl` |
| `src/components/payment/MultiCurrencyPayment.tsx:235` | absolute-bw | `bg-black` |
| `src/components/payment/MultiCurrencyPayment.tsx:388` | absolute-bw | `border-white` |
| `src/components/payment/PaymentIntegration.tsx:118` | absolute-bw | `bg-black` |
| `src/components/pwa/PWAInstallBanner.tsx:105` | absolute-bw | `border-white` |
| `src/components/pwa/PWAInstallBanner.tsx:127` | absolute-bw | `"text-white` |
| `src/components/pwa/PWAInstallBanner.tsx:133` | absolute-bw | `text-white` |
| `src/components/pwa/PWAInstallBanner.tsx:136` | absolute-bw | `text-white` |
| `src/components/pwa/PWAInstallBanner.tsx:145` | absolute-bw | `text-white` |
| `src/components/pwa/PWAInstallBanner.tsx:178` | absolute-bw | `text-white` |
| `src/components/pwa/PWAInstallBanner.tsx:186` | absolute-bw | `text-white, hover:text-white, hover:bg-white` |
| `src/components/pwa/PWAInstallBanner.tsx:195` | absolute-bw | `bg-white` |
| `src/components/search/AdvancedSearchFilters.tsx:65` | absolute-bw | `bg-black` |
| `src/components/sections/ContactSection.tsx:14` | container-width | `max-w-7xl` |
| `src/components/sections/DealsShowcaseSection.tsx:100` | container-width | `max-w-5xl` |
| `src/components/sections/DomainShowcaseTabs.tsx:139` | container-width | `max-w-7xl` |
| `src/components/sections/FeaturesSection.tsx:15` | container-width | `max-w-7xl` |
| `src/components/sections/HeroSection.tsx:94` | container-width | `max-w-5xl` |
| `src/components/sections/HeroSection.tsx:110` | heading-scale | `text-6xl, text-7xl` |
| `src/components/sections/SoldDomains.tsx:23` | container-width | `max-w-7xl` |
| `src/components/sections/StatsSection.tsx:15` | container-width | `max-w-7xl` |
| `src/components/sections/TrendingDomains.tsx:76` | container-width | `max-w-7xl` |
| `src/components/sections/TrendingDomains.tsx:87` | container-width | `max-w-7xl` |
| `src/components/sell/SellDomainQuickListForm.tsx:234` | raw-shadow | `shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)]` |
| `src/components/sell/SellDomainQuickListForm.tsx:258` | heading-scale | `text-6xl` |
| `src/components/usercenter/ProfileSettings.tsx:366` | absolute-bw | `border-white` |
| `src/components/usercenter/UserCenterLayout.tsx:51` | container-width | `max-w-7xl` |
| `src/pages/AdminPanel.tsx:456` | container-width | `max-w-7xl` |
| `src/pages/AuctionsPage.tsx:97` | container-width | `max-w-5xl` |
| `src/pages/AuctionsPage.tsx:124` | container-width | `max-w-5xl` |
| `src/pages/AuctionsPage.tsx:156` | container-width | `max-w-5xl` |
| `src/pages/BulkListingPage.tsx:55` | container-width | `max-w-5xl` |
| `src/pages/ContactPage.tsx:328` | absolute-bw | `border-white` |
| `src/pages/DisputePage.tsx:181` | container-width | `max-w-5xl` |
| `src/pages/DomainMonitorPage.tsx:83` | container-width | `max-w-5xl` |
| `src/pages/EscrowPage.tsx:55` | container-width | `max-w-5xl` |
| `src/pages/FavoritesPage.tsx:42` | container-width | `max-w-5xl` |
| `src/pages/HelpPage.tsx:125` | container-width | `max-w-5xl` |
| `src/pages/Launchpad.tsx:266` | container-width | `max-w-7xl` |
| `src/pages/MyDomainsPage.tsx:18` | container-width | `max-w-7xl` |
| `src/pages/MyOffers.tsx:127` | container-width | `max-w-5xl` |
| `src/pages/NotFound.tsx:11` | heading-scale | `text-7xl` |
| `src/pages/PlatformServicesPage.tsx:95` | container-width | `max-w-5xl` |
| `src/pages/PortfolioPage.tsx:202` | container-width | `max-w-7xl` |
| `src/pages/PortfolioValuation.tsx:198` | container-width | `max-w-5xl` |
| `src/pages/Profile.tsx:68` | container-width | `max-w-5xl` |
| `src/pages/SecurityCenter.tsx:26` | container-width | `max-w-5xl` |
| `src/pages/SellDomain.tsx:84` | container-width | `max-w-5xl` |
| `src/pages/SellDomain.tsx:134` | container-width | `max-w-5xl` |
| `src/pages/SellDomain.tsx:163` | container-width | `max-w-5xl` |
| `src/pages/SellDomain.tsx:184` | container-width | `max-w-5xl` |
| `src/pages/SellDomain.tsx:233` | container-width | `max-w-5xl` |
| `src/pages/SellerEarnings.tsx:154` | container-width | `max-w-5xl` |
| `src/pages/SellerPage.tsx:57` | container-width | `max-w-5xl` |
| `src/pages/SellerPage.tsx:79` | container-width | `max-w-5xl` |
| `src/pages/SellerPage.tsx:173` | container-width | `max-w-7xl` |
| `src/pages/UserProfile.tsx:71` | container-width | `max-w-5xl` |
| `src/pages/UserProfile.tsx:80` | container-width | `max-w-5xl` |
| `src/pages/UserProfile.tsx:108` | container-width | `max-w-5xl` |
| `src/pages/UserProfile.tsx:200` | container-width | `max-w-5xl` |

> 规范见 docs/design-tokens.md。修复方式：颜色改语义 token，容器改 `.page-container`，卡片/表格/弹窗改用 `src/components/layout/PageLayout.tsx` 中的原语。