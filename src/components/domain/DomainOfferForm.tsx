
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Send, Loader2, ShieldCheck } from 'lucide-react';
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
  const captchaRef = useRef<HCaptcha>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate captcha
    if (!captchaToken) {
      toast.error('请完成人机验证');
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
        console.log("Fetching domain information for:", domain);
        // Fetch domain information based on domain name
        const { data: domainData, error: domainError } = await supabase
          .from('domain_listings')
          .select('id, owner_id')
          .eq('name', domain)
          .maybeSingle();
          
        if (domainError) {
          console.error("Error fetching domain info:", domainError);
          throw new Error('查询域名信息时出错，请稍后重试');
        }
        
        if (!domainData) {
          console.error("Domain not found:", domain);
          throw new Error('未找到该域名信息，请确认域名是否正确');
        }
        
        domainInfo = {
          domainId: domainData.id,
          sellerId: domainData.owner_id
        };
        
        console.log("Found domain info:", domainInfo);
      }
      
      // Check if we have the domain information
      if (!domainInfo.domainId || !domainInfo.sellerId) {
        throw new Error('域名信息不完整，无法提交报价');
      }

      const { data: { session } } = await supabase.auth.getSession();
        
      // Send offer via the separate edge function
      const { error: offerError } = await supabase.functions.invoke('send-offer', {
        body: {
          domain: domain,
          offer: offer,
          email: email,
          message: message,
          buyerId: session?.user.id,
          domainId: domainInfo.domainId,
          domainOwnerId: domainInfo.sellerId,
          captchaToken: captchaToken
        }
      });

      if (offerError) {
        console.error('Error submitting offer:', offerError);
        throw new Error(offerError.message || '提交报价失败，请稍后重试');
      }

      toast.success('您的报价已成功提交！');
      setOffer('');
      setEmail('');
      setMessage('');
      setCaptchaToken(null);
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
      }
      onClose();
    } catch (error: any) {
      console.error('Error submitting offer:', error);
      toast.error(error.message || '提交报价失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
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
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">您的报价</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <Input
            type="number"
            placeholder="1000"
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
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
            onChange={(e) => setEmail(e.target.value)}
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
          className="w-full bg-white border border-gray-300 rounded-md p-2 text-black"
          rows={3}
        />
      </div>
      
      <div className="my-4 flex justify-center">
        <HCaptcha
          sitekey="10000000-ffff-ffff-ffff-000000000001" // Replace with your actual hCaptcha site key in production
          onVerify={handleCaptchaVerify}
          ref={captchaRef}
          size="normal"
        />
      </div>
      
      <Button 
        type="submit"
        disabled={isLoading || !captchaToken}
        className="w-full bg-black text-white hover:bg-gray-800 transition-colors"
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
