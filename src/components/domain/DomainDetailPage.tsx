import { Navbar } from "@/components/Navbar";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { DomainSeoHead } from "@/components/domain/DomainSeoHead";
import { useDomainDetail } from "@/components/domain/useDomainDetail";
import { useDomainAnalytics } from "@/hooks/useDomainAnalytics";
import NotFound from "@/pages/NotFound";
import { useState, useEffect } from "react";
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
  ShieldCheck
} from "lucide-react";
import { DomainOwnerInfo } from "./DomainOwnerInfo";
import { DomainWhoisInfo } from "./DomainWhoisInfo";
import { OfferHistory } from "./OfferHistory";
import { DomainValuationReport } from "./DomainValuationReport";
import { PriceHistoryChart } from "./PriceHistoryChart";
import { DomainAnalytics } from "./DomainAnalytics";
import { SimilarDomainsGrid } from "./SimilarDomainsGrid";
import { DomainShareButtons } from "./DomainShareButtons";
import { DomainValuationTool } from "./DomainValuationTool";
import { motion } from "framer-motion";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const DomainDetailPage = () => {
  const { domain, similarDomains, priceHistory, isLoading, error } = useDomainDetail();
  const { analytics, isFavorited, recordView, toggleFavorite } = useDomainAnalytics(domain?.id || '');
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (domain?.id) {
      recordView();
    }
  }, [domain?.id]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <LoadingSpinner size="lg" text="加载域名信息中..." />
        </div>
      </>
    );
  }

  if (error || !domain) {
    return <NotFound />;
  }

  const isOwner = user?.id === domain.owner_id;
  const currency = (domain as any).currency === 'CNY' ? '¥' : '$';

  const handleOffer = () => {
    if (isOwner) return;
    setIsOfferModalOpen(true);
  };

  const handlePurchase = () => {
    if (isOwner) return;
    console.log(`Purchasing ${domain.name}`);
  };

  const handleVerifyDomain = () => {
    if (isOwner) {
      navigate(`/domain-verification/${domain.id}`);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <DomainSeoHead domain={domain} analytics={analytics} />
      <Navbar />
      
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 返回导航 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="hover:bg-accent -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
        </motion.div>

        {/* 核心信息区域 - Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border rounded-2xl p-6 sm:p-8 mb-6 shadow-sm"
        >
          {/* 域名名称和状态 */}
          <div className="text-center mb-6">
            {/* 域名名称在最上方 */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight uppercase mb-4 text-foreground">
              {domain.name}
            </h1>

            {/* 状态徽章 */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {domain.is_verified && (
                <Badge className="bg-green-500/10 text-green-600 border-green-200">
                  <Shield className="h-3 w-3 mr-1" />
                  已验证
                </Badge>
              )}
              <Badge variant="outline" className="capitalize">
                {domain.category}
              </Badge>
              <Badge variant={domain.status === "available" ? "default" : "secondary"}>
                {domain.status === "available" ? "可购买" : "不可用"}
              </Badge>
            </div>

            {/* 统计数据 */}
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {analytics?.views || 0}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {analytics?.favorites || 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {analytics?.offers || 0}
              </span>
            </div>
          </div>

          {/* 价格区域 */}
          <div className="text-center py-6 border-y border-border mb-6">
            <p className="text-sm text-muted-foreground mb-2">一口价</p>
            <div className="text-4xl sm:text-5xl font-black text-foreground">
              {currency}{domain.price.toLocaleString()}
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
                    className={`h-12 font-semibold ${isFavorited ? "text-red-500 border-red-200 bg-red-50" : ""}`}
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
                  <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center justify-center mb-1">
                      <ShieldCheck className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-semibold text-green-800">域名已验证</span>
                    </div>
                    <p className="text-sm text-green-600">您的域名所有权已通过验证</p>
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
          <Accordion type="multiple" defaultValue={["whois", "offers"]} className="space-y-3">
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
                <DomainValuationReport domainName={domain.name} currentPrice={domain.price} />
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
                <PriceHistoryChart data={priceHistory} />
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
                <DomainAnalytics domainId={domain.id} createdAt={domain.created_at} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>

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
          <DomainValuationTool />
        </motion.section>
      </main>

      {/* 报价对话框 */}
      {!isOwner && (
        <Dialog open={isOfferModalOpen} onOpenChange={setIsOfferModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>为 {domain.name} 提交报价</DialogTitle>
              <DialogDescription>
                您的报价将发送给域名所有者。如果他们感兴趣，将通过您提供的邮箱与您联系。
              </DialogDescription>
            </DialogHeader>
            <DomainOfferForm
              domain={domain.name}
              domainId={domain.id}
              sellerId={domain.owner_id}
              onClose={() => setIsOfferModalOpen(false)}
              isAuthenticated={!!user}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
