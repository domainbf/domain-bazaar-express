import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface DomainCardProps {
  domain: string;
  isSold?: boolean;
}

export const DomainCard = ({ domain, isSold = false }: DomainCardProps) => {
  const [offer, setOffer] = useState('');
  const [email, setEmail] = useState('');
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 在实际应用中，这里应该调用后端API来处理邮件发送
    // 这里我们模拟发送成功
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
    <div className="glass-card rounded-xl p-6 relative overflow-hidden group hover:scale-105 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <h3 className="text-2xl font-bold mb-4 text-white relative z-10">{domain}</h3>
      
      {isSold ? (
        <span className="px-4 py-2 bg-red-500/20 text-red-300 rounded-full relative z-10">
          {t('sold')}
        </span>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 relative z-10"
            >
              {t('makeOffer')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-lg border-purple-500/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                {domain} - {t('makeOffer')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('yourOffer')}</label>
                <Input
                  type="number"
                  placeholder={t('yourOffer')}
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('contactEmail')}</label>
                <Input
                  type="email"
                  placeholder={t('contactEmail')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>
              <Button 
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
              >
                {t('submit')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};