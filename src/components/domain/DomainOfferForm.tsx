
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Send, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface DomainOfferFormProps {
  domain: string;
  domainId?: string;
  sellerId?: string;
  onClose: () => void;
  isAuthenticated: boolean;
  initialOffer?: number;
  isBuyNow?: boolean;
}

export const DomainOfferForm = ({ 
  domain, 
  domainId, 
  sellerId, 
  onClose,
  isAuthenticated,
  initialOffer,
  isBuyNow = false,
}: DomainOfferFormProps) => {
  const { session } = useAuth();
  const [offer, setOffer] = useState(initialOffer ? String(initialOffer) : '');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate captcha
    if (!captchaToken) {
      setError('请完成人机验证');
      toast.error('请完成人机验证');
      return;
    }
    
    // 基本验证
    if (!offer || parseFloat(offer) <= 0) {
      setError('请输入有效的报价金额');
      toast.error('请输入有效的报价金额');
      return;
    }
    
    if (!email || !email.includes('@')) {
      setError('请输入有效的邮箱地址');
      toast.error('请输入有效的邮箱地址');
      return;
    }
    
    setIsLoading(true);

    try {
      // Get domain information if it's not provided
      let domainInfo = {
        domainId,
        sellerId
      };
      
      if (!domainId || !sellerId) {
        // Fetch domain information based on domain name
        const { data: domainData, error: domainError } = await supabase
          .from('domain_listings')
          .select('id, owner_id')
          .eq('name', domain)
          .maybeSingle();
          
        if (domainError) {
          console.error("查询域名信息错误:", domainError);
          throw new Error('查询域名信息时出错，请稍后重试');
        }
        
        if (!domainData) {
          console.error("未找到域名:", domain);
          throw new Error('未找到该域名信息，请确认域名是否正确');
        }
        
        domainInfo = {
          domainId: domainData.id,
          sellerId: domainData.owner_id
        };
        
      }
      
      // Check if we have the domain information
      if (!domainInfo.domainId || !domainInfo.sellerId) {
        throw new Error('域名信息不完整，无法提交报价');
      }


      const requestBody = {
        domain_id: domainInfo.domainId,
        seller_id: domainInfo.sellerId,
        buyer_id: session?.user?.id || null,
        amount: parseFloat(offer),
        contact_email: email,
        message: message,
        captcha_token: captchaToken,
      };

      try {
        // Insert offer directly into Supabase
        const { error: insertError } = await supabase
          .from('domain_offers')
          .insert({
            domain_id: domainInfo.domainId,
            seller_id: domainInfo.sellerId,
            buyer_id: session?.user?.id || null,
            amount: parseFloat(offer),
            contact_email: email,
            message: message || '',
            status: 'pending',
          });

        if (insertError) throw new Error(insertError.message);

        // Send email notification via edge function (best-effort)
        supabase.functions.invoke('send-offer', {
          body: {
            domain: domain,
            domainId: domainInfo.domainId,
            offer: offer,
            email: email,
            message: message,
            buyerId: session?.user?.id || null,
          },
        }).catch(err => console.warn('Offer email notification failed:', err));

        toast.success('您的报价已成功提交！买家和卖家都将收到邮件通知。');
        
        // 清空表单
        setOffer('');
        setEmail('');
        setMessage('');
        setCaptchaToken(null);
        if (captchaRef.current) {
          captchaRef.current.resetCaptcha();
        }
        onClose();

      } catch (functionError: any) {
        console.error('Function 调用失败:', functionError);
        throw functionError;
      }
      
    } catch (error: any) {
      console.error('报价提交失败:', error);
      const errorMessage = error.message || '提交报价失败，请稍后重试';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
    setError(null);
  };

  const handleCaptchaError = () => {
    setCaptchaToken(null);
    setError('人机验证失败，请重试');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      {!isAuthenticated && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-md mb-4">
          <p className="text-yellow-700 dark:text-yellow-400 text-sm">
            您尚未登录。您的报价仍会发送给卖家，但创建账户可以让您跟踪报价状态。
          </p>
        </div>
      )}
      
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 p-3 rounded-md mb-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-destructive mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {isBuyNow ? '购买金额（标价）' : '您的报价'}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
          <Input
            type="number"
            placeholder="1000"
            value={offer}
            onChange={(e) => {
              if (!isBuyNow) {
                setOffer(e.target.value);
                setError(null);
              }
            }}
            readOnly={isBuyNow}
            required
            min="1"
            className={`pl-8 ${isBuyNow ? 'bg-muted cursor-default' : ''}`}
          />
        </div>
        {isBuyNow && (
          <p className="text-xs text-muted-foreground">以卖家标价直接提交购买意向</p>
        )}
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">联系邮箱</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            required
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">留言（可选）</label>
        <textarea
          placeholder="添加关于您报价的任何详细信息..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full bg-background border border-input rounded-md p-2 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          rows={3}
        />
      </div>
      
      <div className="my-4 flex justify-center">
        <HCaptcha
          sitekey="10000000-ffff-ffff-ffff-000000000001"
          onVerify={handleCaptchaVerify}
          onError={handleCaptchaError}
          ref={captchaRef}
          size="normal"
        />
      </div>
      
      <Button 
        type="submit"
        disabled={isLoading || !captchaToken}
        className="w-full"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
            提交中...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            {captchaToken ? (
              <>
                <Send className="w-4 h-4" />
                {isBuyNow ? '确认购买' : '提交报价'}
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                请完成人机验证
              </>
            )}
          </span>
        )}
      </Button>
    </form>
  );
};
