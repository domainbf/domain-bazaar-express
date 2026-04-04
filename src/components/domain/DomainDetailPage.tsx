import { Navbar } from "@/components/Navbar";
import { DomainDetailSkeleton } from "@/components/domain/DomainDetailSkeleton";
import { DomainSeoHead } from "@/components/domain/DomainSeoHead";
import { useDomainDetail } from "@/components/domain/useDomainDetail";
import { useDomainAnalytics } from "@/hooks/useDomainAnalytics";
import NotFound from "@/pages/NotFound";
import { useState, useEffect, lazy, Suspense } from "react";
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
  const { domain, similarDomains, priceHistory, isLoading, error } = useDomainDetail();
  const { analytics, trends, isFavorited, recordView, toggleFavorite } = useDomainAnalytics(domain?.id || '');
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isBuyNow, setIsBuyNow] = useState(false);
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
    return <NotFound />;
  }

  const isOwner = user?.id === domain.owner_id;
  const currency = (domain as any).currency === 'CNY' ? '¥' : '$';

  const CATEGORY_LABELS: Record<string, string> = {
    premium: '精品', standard: '标准', short: '短域名',
    brandable: '品牌', dev: '开发', numeric: '数字',
    technology: '科技', business: '商业', general: '通用',
  };

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
        
        <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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
              返回
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
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/30 animate-fade-in">
                    <Shield className="h-3 w-3 mr-1" />
                    已验证
                  </Badge>
                )}
                <Badge variant="outline">
                  {CATEGORY_LABELS[domain.category] || domain.category}
                </Badge>
                <Badge variant={domain.status === "available" ? "default" : "secondary"}>
                  {domain.status === "available" ? "可购买" : "不可用"}
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
          <div className="py-6 border-y border-border mb-6">
            <p className="text-sm text-muted-foreground mb-2 text-center">一口价</p>
            <div className="text-4xl sm:text-5xl font-black text-foreground text-center">
              {currency}{domain.price.toLocaleString()}
            </div>
            <CurrencyConverter
              priceAmount={domain.price}
              priceCurrency={(domain as any).currency || "CNY"}
            />
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
                  立即购买 {currency}{domain.price.toLocaleString()}
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-12 font-semibold"
                    onClick={handleOffer}
                    disabled={domain.status !== "available"}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    提交报价
                  </Button>
                  <Button
                    variant="outline"
                    className={`h-12 font-semibold ${isFavorited ? "text-red-500 border-red-500/30 bg-red-500/10" : ""}`}
                    onClick={toggleFavorite}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${isFavorited ? "fill-current" : ""}`} />
                    {isFavorited ? "已收藏" : "收藏"}
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  所有交易都受到平台保护
                </p>
              </>
            ) : (
              <div className="space-y-3">
                {!domain.is_verified && domain.verification_status !== 'verified' && (
                  <Button className="w-full h-12 font-semibold" onClick={handleVerifyDomain}>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    验证域名所有权
                  </Button>
                )}
                {domain.is_verified && (
                  <div className="text-center p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                    <div className="flex items-center justify-center mb-1">
                      <ShieldCheck className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-semibold text-green-600 dark:text-green-400">域名已验证</span>
                    </div>
                    <p className="text-sm text-green-600">您的域名所有权已通过验证</p>
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
                  <div className="flex items-center justify-center gap-2 py-2 text-sm text-amber-600">
                    <Gavel className="h-4 w-4" />
                    此域名正在进行拍卖
                  </div>
                )}
                <p className="text-xs text-center text-muted-foreground">
                  这是您的域名，您可以在用户中心管理更多设置
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
            <h2 className="text-lg font-bold mb-3 text-foreground">域名描述</h2>
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
                  WHOIS 信息
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
                  出价历史
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
                  域名估值报告
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
                  价格历史
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
                  域名分析
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
              <h2 className="text-lg font-bold text-foreground">正在进行的拍卖</h2>
              <Badge variant="default" className="bg-red-500 hover:bg-red-500 animate-pulse text-xs">拍卖中</Badge>
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
            <h2 className="text-lg font-bold mb-4 text-foreground">相似域名推荐</h2>
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

      {/* 报价对话框 */}
      {!isOwner && (
        <Dialog open={isOfferModalOpen} onOpenChange={(open) => { setIsOfferModalOpen(open); if (!open) setIsBuyNow(false); }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {isBuyNow ? `以 ${currency}${domain.price.toLocaleString()} 购买 ${domain.name}` : `为 ${domain.name} 提交报价`}
              </DialogTitle>
              <DialogDescription>
                {isBuyNow
                  ? '以卖家标价提交购买意向，双方通过站内消息完成交割，平台全程保障安全。'
                  : '您的报价将发送给域名所有者，双方通过站内消息沟通协商，平台全程提供安全保障。'}
              </DialogDescription>
            </DialogHeader>
            <DomainOfferForm
              domain={domain.name}
              domainId={domain.id}
              sellerId={domain.owner_id}
              onClose={() => { setIsOfferModalOpen(false); setIsBuyNow(false); }}
              isAuthenticated={!!user}
              initialOffer={isBuyNow ? domain.price : undefined}
              isBuyNow={isBuyNow}
            />
          </DialogContent>
        </Dialog>
      )}
      </motion.div>
    </AnimatePresence>
  );
};
