
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Crown, Star, Diamond, Award, Mail, Send } from 'lucide-react';
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
    <div className={`relative group rounded-xl p-6 transition-all duration-500 ${
      highlight 
        ? 'bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 hover:from-violet-500/30 hover:via-fuchsia-500/30 hover:to-cyan-500/30' 
        : 'bg-gradient-to-br from-white/5 via-purple-500/5 to-cyan-500/5 hover:from-white/10 hover:via-purple-500/10 hover:to-cyan-500/10'
    }`}>
      <div className="absolute inset-[1px] rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl z-0" />
      
      <div className="relative z-10 flex flex-col items-center space-y-4">
        {highlight && (
          <div className="absolute -top-3 -right-3">
            <Diamond className="w-6 h-6 text-violet-400 animate-pulse" />
          </div>
        )}
        
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          {domain}
          {highlight && <Crown className="w-5 h-5 text-amber-400" />}
        </h3>
        
        {price && (
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            <span className="text-xl font-semibold text-cyan-400">${price}</span>
          </div>
        )}
        
        {isSold ? (
          <span className="px-4 py-2 rounded-full bg-red-500/20 text-red-300 backdrop-blur-md">
            {t('sold')}
          </span>
        ) : (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-violet-500/25"
              >
                {t('makeOffer')}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gradient-to-br from-slate-900/95 to-purple-900/95 backdrop-blur-xl border-violet-500/20 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">
                  {domain} - {t('makeOffer')}
                </DialogTitle>
                <DialogDescription className="text-center text-gray-300 mt-2">
                  {t('offerDescription')}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">{t('yourOffer')}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <Input
                      type="number"
                      placeholder="1000"
                      value={offer}
                      onChange={(e) => setOffer(e.target.value)}
                      required
                      min="1"
                      className="pl-8 bg-white/5 border-violet-500/20 focus:border-violet-500/40 transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">{t('contactEmail')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 bg-white/5 border-violet-500/20 focus:border-violet-500/40 transition-colors"
                    />
                  </div>
                </div>
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-violet-500/25"
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
