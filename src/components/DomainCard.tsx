
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Send } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface DomainCardProps {
  domain: string;
  price?: string;
  highlight?: boolean;
  isSold?: boolean;
}

export const DomainCard = ({ domain, price, highlight, isSold = false }: DomainCardProps) => {
  const [offer, setOffer] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('提交报价:', { domain, offer, email });
      const { data, error } = await supabase.functions.invoke('send-offer', {
        body: {
          domain,
          offer,
          email
        }
      });

      if (error) {
        console.error('提交报价错误:', error);
        toast.error(error.message || t('offerError'));
        return;
      }

      console.log('报价提交成功:', data);
      toast.success(t('offerSuccess'));
      setOffer('');
      setEmail('');
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('报价系统错误:', error);
      toast.error(t('offerError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`simple-card p-6 ${highlight ? 'border-black' : ''}`}>
      <div className="flex flex-col items-center space-y-4">
        <h3 className="text-2xl font-bold text-black">
          {domain}
        </h3>
        
        {price && (
          <span className="text-xl font-semibold text-black">${price}</span>
        )}
        
        {isSold ? (
          <span className="px-4 py-2 rounded-full bg-gray-100 text-gray-500">
            {t('sold')}
          </span>
        ) : (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full bg-black text-white hover:bg-gray-800"
              >
                {t('makeOffer')}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-gray-200 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center text-black">
                  {domain} - {t('makeOffer')}
                </DialogTitle>
                <DialogDescription className="text-center text-gray-600 mt-2">
                  {t('offerDescription')}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">{t('yourOffer')}</label>
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
                  <label className="text-sm font-medium text-gray-700">{t('contactEmail')}</label>
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
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-black text-white hover:bg-gray-800 transition-colors"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('submitting')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      {t('submit')}
                    </span>
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};
