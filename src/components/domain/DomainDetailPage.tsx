import { Navbar } from "@/components/Navbar";
import { DomainDetailSkeleton } from "@/components/domain/DomainDetailSkeleton";
import { DomainSeoHead } from "@/components/domain/DomainSeoHead";
import { useDomainDetail } from "@/components/domain/useDomainDetail";
import { useDomainAnalytics } from "@/hooks/useDomainAnalytics";
import NotFound from "@/pages/NotFound";
import { DomainDetailError } from "./DomainDetailError";
import { useState, useEffect, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DomainOfferForm } from "@/components/domain/DomainOfferForm";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Shield, 
  Eye, 
  Heart, 
  MessageSquare, 
  DollarSign,
  Share2,
  ChevronDown,
  ShieldCheck,
  Gavel
} from "lucide-react";
import { DomainOwnerInfo } from "./DomainOwnerInfo";
import { DomainWhoisInfo } from "./DomainWhoisInfo";
import { OfferHistory } from "./OfferHistory";
import { SimilarDomainsGrid } from "./SimilarDomainsGrid";
import { DomainShareButtons } from "./DomainShareButtons";
import { DomainPublicSummary } from "./DomainPublicSummary";
import { CurrencyConverter } from "./CurrencyConverter";
import { DomainAuction } from "@/components/auction/DomainAuction";
import { CreateAuctionDialog } from "@/components/auction/CreateAuctionDialog";
import { supabase } from "@/integrations/supabase/client";
import { DomainAuction as AuctionType } from "@/types/domain";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const DomainValuationReport = lazy(() => import("./DomainValuationReport").then(m => ({ default: m.DomainValuationReport })));
const PriceHistoryChart = lazy(() => import("./PriceHistoryChart").then(m => ({ default: m.PriceHistoryChart })));
const DomainAnalytics = lazy(() => import("./DomainAnalytics").then(m => ({ default: m.DomainAnalytics })));
const DomainValuationTool = lazy(() => import("./DomainValuationTool").then(m => ({ default: m.DomainValuationTool })));
const LazyMessageCenter = lazy(() => import("@/components/messages/MessageCenter").then(m => ({ default: m.MessageCenter })));

// 页面过渡动画配置
const pageVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { 
      duration: 0.4,
      staggerChildren: 0.08
    }
  },
  exit: { opacity: 0 }
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

const cardHoverVariants = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.01,
    boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)",
    transition: { duration: 0.2 }
  }
};

export const DomainDetailPage = () => {
  const { t } = useTranslation();
  const { domain, similarDomains, priceHistory, isLoading, error, reload } = useDomainDetail() as any;
  const { analytics, trends, isFavorited, recordView, toggleFavorite } = useDomainAnalytics(domain?.id || '');
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isBuyNow, setIsBuyNow] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [activeAuction, setActiveAuction] = useState<AuctionType | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (domain?.id) {
      recordView();
      loadActiveAuction(domain.id);
    }
  }, [domain?.id]);

  const loadActiveAuction = async (domainId: string) => {
    try {
      const { data } = await supabase
        .from('domain_auctions')
        .select('*')
        .eq('domain_id', domainId)
        .eq('status', 'active')
        .gt('end_time', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setActiveAuction(data as unknown as AuctionType);
    } catch { /* gracefully ignore */ }
  };

  // 使用骨架屏代替 LoadingSpinner
  if (isLoading) {
    return <DomainDetailSkeleton />;
  }

  if (error || !domain) {
    return <DomainDetailError error={error as Error | null} onRetry={() => reload?.()} />;
  }

  const isOwner = user?.id === domain.owner_id;
  const currency = (domain as any).currency === 'CNY' ? '¥' : '$';

  const categoryLabel = (c: string) => t(`domains.categories.${c}`, { defaultValue: c });

  const handleOffer = () => {
    if (isOwner) return;
    setIsBuyNow(false);
    setIsOfferModalOpen(true);
  };

  const handlePurchase = () => {
    if (isOwner) return;
    setIsBuyNow(true);
    setIsOfferModalOpen(true);
  };

  const handleVerifyDomain = () => {
    if (isOwner) {
      navigate(`/domain-verification/${domain.id}`);
    }
  };

  const handleContactSeller = () => {
    if (isOwner) return;
    if (!user) {
      navigate(`/auth?redirect=/domain/${domain.name}`);
      return;
    }
    if (!domain.owner_id) return;
    setIsContactOpen(true);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        className="bg-background min-h-screen"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <DomainSeoHead domain={domain} analytics={analytics} />
        <Navbar />
        
        <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8 pb-32 sm:pb-8">
          {/* 返回导航 */}
          <motion.div
            variants={itemVariants}
            className="mb-6"
          >
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="hover:bg-accent -ml-2 transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('domains.detail.back')}
            </Button>
          </motion.div>

          {/* 核心信息区域 - Hero Section */}
          <motion.section 
            variants={itemVariants}
            whileHover="hover"
            initial="rest"
            animate="rest"
            className="bg-card border rounded-2xl p-6 sm:p-8 mb-6 shadow-sm transition-shadow duration-300"
          >
            {/* 域名名称和状态 */}
            <motion.div 
              className="text-center mb-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* 域名名称在最上方 */}
              <motion.h1 
                className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight uppercase mb-4 text-foreground"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                {domain.name}
              </motion.h1>

              {/* 状态徽章 */}
              <motion.div 
                className="flex items-center justify-center gap-2 mb-4 flex-wrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                {domain.is_verified && (
                  <Badge className="bg-success/10 text-success border-success/30 animate-fade-in">
                    <Shield className="h-3 w-3 mr-1" />
                    {t('domains.detail.verified')}
                  </Badge>
                )}
                <Badge variant="outline">
                  {categoryLabel(domain.category)}
                </Badge>
                <Badge variant={domain.status === "available" ? "default" : "secondary"}>
                  {domain.status === "available" ? t('domains.detail.availableLabel') : t('domains.detail.unavailableLabel')}
                </Badge>
              </motion.div>

              {/* 统计数据 */}
              <motion.div 
                className="flex items-center justify-center gap-6 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <span className="flex items-center gap-1 transition-transform hover:scale-110">
                  <Eye className="h-4 w-4" />
                  {analytics?.views || 0}
                </span>
                <span className="flex items-center gap-1 transition-transform hover:scale-110">
                  <Heart className="h-4 w-4" />
                  {analytics?.favorites || 0}
                </span>
                <span className="flex items-center gap-1 transition-transform hover:scale-110">
                  <MessageSquare className="h-4 w-4" />
                  {analytics?.offers || 0}
                </span>
              </motion.div>
            </motion.div>

          {/* 价格区域 */}
          <div className="py-6 border-y border-border mb-6 flex flex-col items-center">
            <p className="text-sm text-muted-foreground mb-2">{t('domains.detail.askingPrice')}</p>
            <div className="text-4xl sm:text-5xl font-black text-foreground leading-none">
              {currency}{domain.price.toLocaleString()}
            </div>
            <div className="mt-3">
              <CurrencyConverter
                priceAmount={domain.price}
                priceCurrency={(domain as any).currency || "CNY"}
              />
            </div>
          </div>

          {/* 操作按钮区域 */}
          <div className="space-y-3">
            {!isOwner ? (
              <>
                <Button
                  className="w-full h-14 text-lg font-bold"
                  size="lg"
                  onClick={handlePurchase}
                  disabled={domain.status !== "available"}
                >
                  <DollarSign className="h-5 w-5 mr-2" />
                  {t('domains.detail.buyNowPrice', { price: `${currency}${domain.price.toLocaleString()}` })}
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-12 font-semibold"
                    onClick={handleOffer}
                    disabled={domain.status !== "available"}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    {t('domains.detail.makeOffer')}
                  </Button>
                  <Button
                    variant="outline"
                    className={`h-12 font-semibold ${isFavorited ? "text-destructive border-destructive/30 bg-destructive/10" : ""}`}
                    onClick={toggleFavorite}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${isFavorited ? "fill-current" : ""}`} />
                    {isFavorited ? t('domains.detail.favorited') : t('domains.detail.favorite')}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  className="w-full h-11 font-medium"
                  onClick={handleContactSeller}
                  disabled={!domain.owner_id}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t('domains.detail.contactSeller')}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  {t('domains.detail.protectedByPlatform')}
                </p>
              </>
            ) : (
              <div className="space-y-3">
                {!domain.is_verified && domain.verification_status !== 'verified' && (
                  <Button className="w-full h-12 font-semibold" onClick={handleVerifyDomain}>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    {t('domains.detail.verifyOwnership')}
                  </Button>
                )}
                {domain.is_verified && (
                  <div className="text-center p-4 bg-success/10 rounded-xl border border-success/30">
                    <div className="flex items-center justify-center mb-1">
                      <ShieldCheck className="h-5 w-5 text-success mr-2" />
                      <span className="font-semibold text-success ">{t('domains.detail.verifiedTitle')}</span>
                    </div>
                    <p className="text-sm text-success">{t('domains.detail.verifiedDesc')}</p>
                  </div>
                )}
                {!activeAuction && (
                  <CreateAuctionDialog
                    domainId={domain.id}
                    domainName={domain.name}
                    currentPrice={domain.price}
                    onCreated={() => loadActiveAuction(domain.id)}
                  />
                )}
                {activeAuction && (
                  <div className="flex items-center justify-center gap-2 py-2 text-sm text-warning">
                    <Gavel className="h-4 w-4" />
                    {t('domains.detail.auctionActive')}
                  </div>
                )}
                <p className="text-xs text-center text-muted-foreground">
                  {t('domains.detail.ownerHint')}
                </p>
              </div>
            )}
          </div>

          {/* 分享按钮 */}
          <div className="mt-6 pt-4 border-t border-border">
            <DomainShareButtons domainName={domain.name} />
          </div>
        </motion.section>

        {/* 域名描述 */}
        {domain.description && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border rounded-xl p-6 mb-6 shadow-sm"
          >
            <h2 className="text-lg font-bold mb-3 text-foreground">{t('domains.detail.sections.description')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {domain.description}
            </p>
          </motion.section>
        )}

        {/* 卖家信息 */}
        {domain.owner && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <DomainOwnerInfo owner={domain.owner} />
          </motion.section>
        )}

        {/* 可折叠的详细信息区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 mb-6"
        >
          <Accordion type="multiple" defaultValue={[]} className="space-y-3">
            {/* WHOIS 信息 */}
            <AccordionItem value="whois" className="border rounded-xl bg-card shadow-sm overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-accent/50 [&[data-state=open]>svg]:rotate-180">
                <span className="flex items-center gap-2 font-bold text-foreground">
                  <Shield className="h-5 w-5 text-primary" />
                  {t('domains.detail.sections.whois')}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <DomainWhoisInfo domainName={domain.name} />
              </AccordionContent>
            </AccordionItem>

            {/* 出价历史 */}
            <AccordionItem value="offers" className="border rounded-xl bg-card shadow-sm overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-accent/50">
                <span className="flex items-center gap-2 font-bold text-foreground">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  {t('domains.detail.sections.offerHistory')}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <OfferHistory domainId={domain.id} currentPrice={domain.price} />
              </AccordionContent>
            </AccordionItem>

            {/* 域名估值 */}
            <AccordionItem value="valuation" className="border rounded-xl bg-card shadow-sm overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-accent/50">
                <span className="flex items-center gap-2 font-bold text-foreground">
                  <DollarSign className="h-5 w-5 text-primary" />
                  {t('domains.detail.sections.valuation')}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-lg" />}>
                  <DomainValuationReport domainName={domain.name} currentPrice={domain.price} />
                </Suspense>
              </AccordionContent>
            </AccordionItem>

            {/* 价格历史 */}
            <AccordionItem value="price-history" className="border rounded-xl bg-card shadow-sm overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-accent/50">
                <span className="flex items-center gap-2 font-bold text-foreground">
                  <ChevronDown className="h-5 w-5 text-primary rotate-0" />
                  {t('domains.detail.sections.priceHistory')}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <Suspense fallback={<div className="h-48 animate-pulse bg-muted rounded-lg" />}>
                  <PriceHistoryChart data={priceHistory as any} />
                </Suspense>
              </AccordionContent>
            </AccordionItem>

            {/* 域名分析 */}
            <AccordionItem value="analytics" className="border rounded-xl bg-card shadow-sm overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-accent/50">
                <span className="flex items-center gap-2 font-bold text-foreground">
                  <Eye className="h-5 w-5 text-primary" />
                  {t('domains.detail.sections.analytics')}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <Suspense fallback={<div className="h-48 animate-pulse bg-muted rounded-lg" />}>
                  <DomainAnalytics
                    domainId={domain.id}
                    createdAt={domain.created_at}
                    analytics={analytics}
                    trends={trends}
                    isFavorited={isFavorited}
                    toggleFavorite={toggleFavorite}
                  />
                </Suspense>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>

        {/* 拍卖区域 */}
        {activeAuction && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Gavel className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">{t('domains.detail.sections.ongoingAuction')}</h2>
              <Badge variant="default" className="bg-destructive hover:bg-destructive animate-pulse text-xs">{t('domains.detail.sections.auctionBadge')}</Badge>
            </div>
            <DomainAuction auction={activeAuction} onBidPlaced={() => loadActiveAuction(domain.id)} />
          </motion.section>
        )}

        {/* 相似域名推荐 */}
        {similarDomains.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card border rounded-xl p-6 mb-6 shadow-sm"
          >
            <h2 className="text-lg font-bold mb-4 text-foreground">{t('domains.detail.sections.similarRecommendations')}</h2>
            <SimilarDomainsGrid domains={similarDomains} currentDomainName={domain.name} />
          </motion.section>
        )}

        {/* 域名估值工具 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-lg" />}>
            <DomainValuationTool />
          </Suspense>
        </motion.section>
        </main>

        {/* 移动端底部固定操作栏 */}
        {!isOwner && domain.status === 'available' && (
          <div
            className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border shadow-elegant"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex items-center gap-2 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground leading-tight">{t('domains.detail.mobileBar.price')}</p>
                <p className="text-lg font-black tabular-nums text-foreground truncate">
                  {currency}{domain.price.toLocaleString()}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleOffer} className="h-11 px-3">
                <MessageSquare className="h-4 w-4 mr-1" />{t('domains.detail.mobileBar.offer')}
              </Button>
              <Button size="sm" onClick={handlePurchase} className="h-11 px-4 font-bold">
                <DollarSign className="h-4 w-4 mr-1" />{t('domains.detail.mobileBar.buyNow')}
              </Button>
            </div>
          </div>
        )}


      {/* 报价对话框 */}
      {!isOwner && (
        <Dialog open={isOfferModalOpen} onOpenChange={(open) => { setIsOfferModalOpen(open); if (!open) setIsBuyNow(false); }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {isBuyNow
                  ? t('domains.detail.offerDialog.buyTitle', { price: `${currency}${domain.price.toLocaleString()}`, name: domain.name })
                  : t('domains.detail.offerDialog.offerTitle', { name: domain.name })}
              </DialogTitle>
              <DialogDescription>
                {isBuyNow
                  ? t('domains.detail.offerDialog.buyDesc')
                  : t('domains.detail.offerDialog.offerDesc')}
              </DialogDescription>
            </DialogHeader>
            <DomainOfferForm
              domain={domain.name}
              domainId={domain.id}
              sellerId={domain.owner_id}
              onClose={() => { setIsOfferModalOpen(false); setIsBuyNow(false); }}
              isAuthenticated={!!user}
              initialOffer={isBuyNow ? domain.price : undefined}
              initialCurrency={(domain as any).currency || 'CNY'}
              listingPrice={domain.price}
              listingCurrency={(domain as any).currency || 'CNY'}
              isBuyNow={isBuyNow}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* 联系卖家对话框 */}
      {!isOwner && domain.owner_id && (
        <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
          <DialogContent className="sm:max-w-[560px] p-0 gap-0 h-[80vh] flex flex-col">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="text-base">{t('domains.detail.contactDialog.title', { name: domain.name })}</DialogTitle>
              <DialogDescription className="text-xs">
                {t('domains.detail.contactDialog.desc')}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-hidden">
              <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">{t('domains.detail.contactDialog.loading')}</div>}>
                <LazyMessageCenter otherUserId={domain.owner_id} domainId={domain.id} />
              </Suspense>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </motion.div>
    </AnimatePresence>
  );
};
