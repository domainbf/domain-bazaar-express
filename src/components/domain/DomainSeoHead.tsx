import React from "react";
import { Helmet } from "react-helmet-async";
import { Domain } from "@/types/domain";
import { getCanonicalUrl, getHreflangAlternates, SITE_ORIGIN } from "@/lib/canonicalUrl";

interface Props {
  domain: Domain;
  analytics?: {
    views?: number;
    favorites?: number;
    offers?: number;
  };
}

// ISO currency code guard (schema.org expects ISO 4217).
const normalizeCurrency = (c?: string | null) => {
  const v = (c || 'USD').toUpperCase();
  return /^[A-Z]{3}$/.test(v) ? v : 'USD';
};

// schema.org availability enum mapping.
const availabilityFor = (status?: string) => {
  switch (status) {
    case 'available': return 'https://schema.org/InStock';
    case 'reserved': return 'https://schema.org/PreOrder';
    case 'pending': return 'https://schema.org/LimitedAvailability';
    case 'sold': return 'https://schema.org/SoldOut';
    default: return 'https://schema.org/OutOfStock';
  }
};

// Price validity: default to +90 days from now if none set on the domain.
const defaultPriceValidUntil = () => {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toISOString().split('T')[0];
};

export const DomainSeoHead: React.FC<Props> = ({ domain, analytics }) => {
  const domainPath = `/domain/${encodeURIComponent(domain.name)}`;
  const domainUrl = getCanonicalUrl(domainPath);
  const alternates = getHreflangAlternates(domainPath);

  const currency = normalizeCurrency((domain as any).currency);
  const currencySymbol = currency === 'CNY' ? '¥' : currency === 'USD' ? '$' : '';
  const priceText = `${currencySymbol}${Number(domain.price || 0).toLocaleString()}`;
  const availability = availabilityFor(domain.status);
  const isForSale = domain.status === 'available' || domain.status === 'reserved';

  // Dynamic OG image (price + domain + status). Cache-buster tied to updated_at
  // so social platforms refetch when the listing changes.
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://trqxaizkwuizuhlfmdup.supabase.co';
  const cacheKey = (domain as any).updated_at
    ? Date.parse((domain as any).updated_at) || Date.now()
    : Date.now();
  const ogImageUrl = `${supabaseUrl}/functions/v1/og-image?d=${encodeURIComponent(domain.name)}&p=${Number(domain.price || 0)}&c=${currency}&s=${domain.status || 'available'}&v=${cacheKey}`;

  const title = `${domain.name} - ${domain.category === 'premium' ? '精品' : '优质'}域名出售 | 域见•你`;
  const description = domain.description
    ? `${domain.name} 域名出售，价格${priceText}。${String(domain.description).slice(0, 100)}`
    : `${domain.name} 优质域名出售，一口价${priceText}。立即购买或提交报价，安全交易有保障。`;

  const sellerName = domain.owner?.username || domain.owner?.full_name || '域见•你';
  const sellerOrg: Record<string, unknown> = {
    "@type": "Organization",
    "name": sellerName,
    "url": SITE_ORIGIN,
  };
  // Optional locale/geo: platform is registered in CN — describe the marketplace org.
  const marketplaceOrg = {
    "@type": "Organization",
    "name": "域见•你",
    "url": SITE_ORIGIN,
    "logo": `${SITE_ORIGIN}/og-image.png`,
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "CN",
      "addressLocality": "Global",
    },
    "areaServed": ["CN", "US", "Worldwide"],
  };

  // Rich Offer with PriceSpecification, availability, valid-until, condition,
  // seller Organization and marketplace reference.
  const offer = {
    "@type": "Offer",
    "url": domainUrl,
    "priceCurrency": currency,
    "price": Number(domain.price || 0),
    "priceSpecification": {
      "@type": "PriceSpecification",
      "price": Number(domain.price || 0),
      "priceCurrency": currency,
      "valueAddedTaxIncluded": false,
    },
    "availability": availability,
    "itemCondition": "https://schema.org/NewCondition",
    "priceValidUntil": (domain as any).price_valid_until || defaultPriceValidUntil(),
    "seller": sellerOrg,
    "offeredBy": marketplaceOrg,
    "areaServed": ["Worldwide"],
    "acceptedPaymentMethod": [
      "https://schema.org/CreditCard",
      "http://purl.org/goodrelations/v1#PayPal",
    ],
    "eligibleRegion": { "@type": "Place", "name": "Worldwide" },
  };

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": domain.name,
    "description": domain.description || `${domain.name} 域名出售`,
    "category": "Domain Name",
    "sku": domain.name,
    "brand": { "@type": "Brand", "name": "域见•你" },
    "offers": offer,
  };
  if (domain.owner?.seller_rating) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": domain.owner.seller_rating,
      "bestRating": "5",
      "worstRating": "1",
      "ratingCount": analytics?.offers || 1,
    };
  }

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "首页", "item": SITE_ORIGIN },
      { "@type": "ListItem", "position": 2, "name": "域名市场", "item": `${SITE_ORIGIN}/marketplace` },
      { "@type": "ListItem", "position": 3, "name": domain.name, "item": domainUrl },
    ],
  };

  const webPageData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": title,
    "description": description,
    "url": domainUrl,
    "inLanguage": "zh-CN",
    "isPartOf": { "@type": "WebSite", "name": "域见•你", "url": SITE_ORIGIN },
    "about": { "@type": "Thing", "name": domain.name, "description": `Domain name: ${domain.name}` },
    "datePublished": domain.created_at,
    "interactionStatistic": [
      { "@type": "InteractionCounter", "interactionType": "https://schema.org/ViewAction", "userInteractionCount": analytics?.views || 0 },
      { "@type": "InteractionCounter", "interactionType": "https://schema.org/LikeAction", "userInteractionCount": analytics?.favorites || 0 },
    ],
  };

  return (
    <Helmet>
      <html lang="zh-CN" />
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={`${domain.name}, 域名出售, 域名交易, ${domain.category || '域名'}, 买域名, domain for sale`} />
      <link rel="canonical" href={domainUrl} />

      {/* hreflang alternates for language/region variants */}
      {alternates.map(a => (
        <link key={a.hrefLang} rel="alternate" hrefLang={a.hrefLang} href={a.href} />
      ))}

      <meta property="og:type" content="product" />
      <meta property="og:url" content={domainUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="域见•你" />
      <meta property="og:locale" content="zh_CN" />
      <meta property="og:locale:alternate" content="en_US" />

      {/* Product / price metadata (Facebook, Pinterest, etc.) */}
      <meta property="product:price:amount" content={String(domain.price || 0)} />
      <meta property="product:price:currency" content={currency} />
      <meta property="product:availability" content={isForSale ? 'in stock' : 'out of stock'} />
      <meta property="product:condition" content="new" />
      <meta property="og:price:amount" content={String(domain.price || 0)} />
      <meta property="og:price:currency" content={currency} />
      <meta property="og:availability" content={isForSale ? 'instock' : 'oos'} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={domainUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />
      <meta name="twitter:label1" content="Price" />
      <meta name="twitter:data1" content={priceText} />
      <meta name="twitter:label2" content="Status" />
      <meta name="twitter:data2" content={isForSale ? '在售' : '不可售'} />

      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
      <meta name="author" content="域见•你" />
      <meta name="language" content="zh-CN" />
      <meta httpEquiv="content-language" content="zh-CN" />

      {/* Geo hints for regional search grounding */}
      <meta name="geo.region" content="CN" />
      <meta name="geo.placename" content="Global" />

      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbData)}</script>
      <script type="application/ld+json">{JSON.stringify(webPageData)}</script>
    </Helmet>
  );
};
