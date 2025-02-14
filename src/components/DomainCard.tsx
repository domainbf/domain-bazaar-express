
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Crown, Star, Diamond, Award } from 'lucide-react';

interface DomainCardProps {
  domain: string;
  price?: string;
  highlight?: boolean;
  isSold?: boolean;
}

export const DomainCard = ({ domain, price, highlight, isSold = false }: DomainCardProps) => {
  const [offer, setOffer] = useState('');
  const [email, setEmail] = useState('');
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailContent = `
      Domain: ${domain}
      Offer: $${offer}
      Contact Email: ${email}
    `;
    
    console.log('Sending email to domain@nic.bn:', emailContent);
    
    toast.success(t('offerSuccess'));
    setOffer('');
    setEmail('');
  };

  return (
    <div className={`relative group rounded-xl p-6 transition-all duration-500 ${
      highlight 
        ? 'bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 hover:from-violet-500/30 hover:via-fuchsia-500/30 hover:to-cyan-500/30' 
        : 'bg-gradient-to-br from-white/5 via-purple-500/5 to-cyan-500/5 hover:from-white/10 hover:via-purple-500/10 hover:to-cyan-500/10'
    }`}>
      {/* Glowing background effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
      
      {/* Glass effect with subtle border */}
      <div className="absolute inset-[1px] rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl z-0" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center space-y-4">
        {/* Premium indicator */}
        {highlight && (
          <div className="absolute -top-3 -right-3 p-2 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full shadow-lg animate-pulse">
            <Crown className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Domain name with icon */}
        <div className="flex items-center gap-2 mb-2">
          {highlight ? (
            <Diamond className="w-5 h-5 text-violet-400" />
          ) : (
            <Star className="w-5 h-5 text-cyan-400" />
          )}
          <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-cyan-200">
            {domain}
          </h3>
        </div>
        
        {/* Price with award icon */}
        {price && (
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-fuchsia-400" />
            <div className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">
              ${price}
            </div>
          </div>
        )}
        
        {isSold ? (
          <span className="px-4 py-2 rounded-full bg-red-500/20 text-red-300 backdrop-blur-md">
            {t('sold')}
          </span>
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                className="w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-violet-500/25"
              >
                {t('makeOffer')}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gradient-to-br from-slate-900/95 to-purple-900/95 backdrop-blur-xl border-violet-500/20">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">
                  {domain} - {t('makeOffer')}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">{t('yourOffer')}</label>
                  <Input
                    type="number"
                    placeholder={t('yourOffer')}
                    value={offer}
                    onChange={(e) => setOffer(e.target.value)}
                    required
                    className="bg-white/5 border-violet-500/20 focus:border-violet-500/40 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">{t('contactEmail')}</label>
                  <Input
                    type="email"
                    placeholder={t('contactEmail')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/5 border-violet-500/20 focus:border-violet-500/40 transition-colors"
                  />
                </div>
                <Button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-violet-500/25"
                >
                  {t('submit')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};
