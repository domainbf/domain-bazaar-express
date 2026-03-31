import React from "react";
import { Helmet } from "react-helmet-async";
import { Domain } from "@/types/domain";

interface Props {
  domain: Domain;
  analytics?: {
    views?: number;
    favorites?: number;
    offers?: number;
  };
}

export const DomainSeoHead: React.FC<Props> = ({ domain, analytics }) => {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : "";
  const domainUrl = `${siteUrl}/domain/${encodeURIComponent(domain.name)}`;
  const ogImageUrl = `${siteUrl}/og-image.png`;

  const title = `${domain.name} - ${domain.category === 'premium' ? '精品' : '优质'}域名出售 | 域见•你`;
  
  const priceText = `¥${domain.price.toLocaleString()}`;
  
  const description = domain.description 
    ? `${domain.name} 域名出售，价格${priceText}。${domain.description.slice(0, 100)}`
    : `${domain.name} 优质域名出售，一口价${priceText}。立即购买或提交报价，安全交易有保障。`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": domain.name,
    "description": domain.description || `${domain.name} 域名出售`,
    "category": "Domain Name",
    "brand": {
      "@type": "Brand",
      "name": "域见•你"
    },
    "offers": {
      "@type": "Offer",
      "url": domainUrl,
      "priceCurrency": domain.currency || "USD",
      "price": domain.price,
      "availability": domain.status === "available" 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": domain.owner?.username || domain.owner?.full_name || "域见•你"
      }
    },
    "aggregateRating": domain.owner?.seller_rating ? {
      "@type": "AggregateRating",
      "ratingValue": domain.owner.seller_rating,
      "bestRating": "5",
      "worstRating": "1",
      "ratingCount": analytics?.offers || 1
    } : undefined
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "首页", "item": siteUrl },
      { "@type": "ListItem", "position": 2, "name": "域名市场", "item": `${siteUrl}/marketplace` },
      { "@type": "ListItem", "position": 3, "name": domain.name, "item": domainUrl }
    ]
  };

  const webPageData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": title,
    "description": description,
    "url": domainUrl,
    "isPartOf": { "@type": "WebSite", "name": "域见•你", "url": siteUrl },
    "about": { "@type": "Thing", "name": domain.name, "description": `Domain name: ${domain.name}` },
    "datePublished": domain.created_at,
    "interactionStatistic": [
      { "@type": "InteractionCounter", "interactionType": "https://schema.org/ViewAction", "userInteractionCount": analytics?.views || 0 },
      { "@type": "InteractionCounter", "interactionType": "https://schema.org/LikeAction", "userInteractionCount": analytics?.favorites || 0 }
    ]
  };

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={`${domain.name}, 域名出售, 域名交易, ${domain.category || '域名'}, 买域名, domain for sale`} />
      <link rel="canonical" href={domainUrl} />
      <meta property="og:type" content="product" />
      <meta property="og:url" content={domainUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:site_name" content="域见•你" />
      <meta property="og:locale" content="zh_CN" />
      <meta property="product:price:amount" content={domain.price.toString()} />
      <meta property="product:price:currency" content={domain.currency || "USD"} />
      <meta property="product:availability" content={domain.status === "available" ? "in stock" : "out of stock"} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={domainUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />
      <meta name="robots" content="index, follow" />
      <meta name="author" content="域见•你" />
      <meta name="language" content="zh-CN" />
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbData)}</script>
      <script type="application/ld+json">{JSON.stringify(webPageData)}</script>
    </Helmet>
  );
};
