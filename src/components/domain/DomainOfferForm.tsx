
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Send, Loader2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          .single();
          
        if (domainError || !domainData) {
          throw new Error('无法找到域名信息，请稍后重试');
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

      const { data: { session } } = await supabase.auth.getSession();
      
      const offerData = {
        domain_id: domainInfo.domainId,
        amount: parseFloat(offer),
        message: message,
        contact_email: email,
        seller_id: domainInfo.sellerId,
        buyer_id: session?.user.id
      };

      // If user is logged in, save the offer to the database
      if (session) {
        const { error } = await supabase
          .from('domain_offers')
          .insert([offerData]);
        
        if (error) throw error;
      }
      
      // Get owner email for notification purposes
      let ownerEmail;
      try {
        const { data: ownerData } = await supabase
          .from('profiles')
          .select('contact_email')
          .eq('id', domainInfo.sellerId)
          .single();
        
        if (ownerData) {
          ownerEmail = ownerData.contact_email;
        }
      } catch (error) {
        console.error('Error fetching owner email:', error);
        // Continue without owner email if there's an error
      }
        
      // Send email notification regardless of authentication
      const { error: emailError } = await supabase.functions.invoke('send-offer', {
        body: {
          domain,
          offer,
          email,
          message,
          buyerId: session?.user.id || null,
          domainOwnerId: domainInfo.sellerId,
          domainId: domainInfo.domainId,
          ownerEmail: ownerEmail
        }
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
        // Continue execution even if email fails
      }

      toast.success('您的报价已成功提交！');
      setOffer('');
      setEmail('');
      setMessage('');
      onClose();
    } catch (error: any) {
      console.error('Error submitting offer:', error);
      toast.error(error.message || '提交报价失败');
    } finally {
      setIsLoading(false);
    }
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
      <Button 
        type="submit"
        disabled={isLoading}
        className="w-full bg-black text-white hover:bg-gray-800 transition-colors"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
            提交中...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            提交报价
          </span>
        )}
      </Button>
    </form>
  );
};
