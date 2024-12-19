import { useState } from 'react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you would typically integrate with an email service
    // For now, we'll just show a success message
    toast.success("报价已提交! 我们会尽快联系您。");
    setOffer('');
    setEmail('');
  };

  return (
    <div className="glass-card rounded-xl p-6 relative overflow-hidden animate-float">
      <h3 className="text-2xl font-bold mb-4 text-white">{domain}</h3>
      
      {isSold ? (
        <span className="px-4 py-2 bg-red-500/20 text-red-300 rounded-full">
          已售
        </span>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 animate-glow"
            >
              提交报价
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                {domain} - 报价
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">您的报价 (USD)</label>
                <Input
                  type="number"
                  placeholder="请输入您的报价"
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">联系邮箱</label>
                <Input
                  type="email"
                  placeholder="请输入您的邮箱"
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
                提交报价
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};