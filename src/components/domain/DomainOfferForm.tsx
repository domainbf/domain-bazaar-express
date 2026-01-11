
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Send, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface DomainOfferFormProps {
  domain: string;
  domainId?: string;
  sellerId?: string;
  onClose: () => void;
  isAuthenticated: boolean;
}

export const DomainOfferForm = ({ 
  domain, 
  domainId, 
  sellerId, 
  onClose,
  isAuthenticated 
}: DomainOfferFormProps) => {
  const [offer, setOffer] = useState('');
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
        console.log("获取域名信息:", domain);
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
        
        console.log("找到域名信息:", domainInfo);
      }
      
      // Check if we have the domain information
      if (!domainInfo.domainId || !domainInfo.sellerId) {
        throw new Error('域名信息不完整，无法提交报价');
      }

      const { data: { session } } = await supabase.auth.getSession();
        
      // Send offer via the separate edge function
      console.log("发送报价请求...");
      
      const requestBody = {
        domain: domain,
        offer: offer,
        email: email,
        message: message,
        buyerId: session?.user?.id || null,
        domainId: domainInfo.domainId,
        sellerId: domainInfo.sellerId,
        captchaToken: captchaToken
      };

      console.log("报价请求数据:", requestBody);

      try {
        // 使用supabase.functions.invoke方法调用edge function
        const { data, error: offerError } = await supabase.functions.invoke('send-offer', {
          body: requestBody
        });

        if (offerError) {
          console.error('Edge Function 调用错误:', offerError);
          throw new Error(offerError.message || '报价提交失败，请稍后重试');
        }

        if (data && !data.success) {
          throw new Error(data.error || '报价提交失败');
        }

        console.log('报价提交成功:', data);
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
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mb-4">
          <p className="text-yellow-800 text-sm">
            您尚未登录。您的报价仍会发送给卖家，但创建账户可以让您跟踪报价状态。
          </p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-md mb-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">您的报价</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <Input
            type="number"
            placeholder="1000"
            value={offer}
            onChange={(e) => {
              setOffer(e.target.value);
              setError(null);
            }}
            required
            min="1"
            className="pl-8 bg-white border-gray-300 focus:border-black transition-colors"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">联系邮箱</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            required
            className="pl-10 bg-white border-gray-300 focus:border-black transition-colors"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">留言（可选）</label>
        <textarea
          placeholder="添加关于您报价的任何详细信息..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-md p-2 text-black resize-none"
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
        className="w-full bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
            提交中...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            {captchaToken ? (
              <>
                <Send className="w-4 h-4" />
                提交报价
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
