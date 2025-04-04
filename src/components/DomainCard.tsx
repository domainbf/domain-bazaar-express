
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { DomainOfferForm } from './domain/DomainOfferForm';
import { Badge } from './ui/badge';

interface DomainCardProps {
  domain: string;
  price?: number | string;
  highlight?: boolean;
  isSold?: boolean;
  domainId?: string;
  sellerId?: string;
  category?: string;
  description?: string;
}

export const DomainCard = ({ 
  domain, 
  price, 
  highlight, 
  isSold = false, 
  domainId, 
  sellerId,
  category,
  description 
}: DomainCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [domainInfo, setDomainInfo] = useState<{id?: string; ownerId?: string}>({
    id: domainId,
    ownerId: sellerId
  });

  // Check if user is authenticated when dialog opens
  const handleOpenDialog = async () => {
    const { data } = await supabase.auth.getSession();
    setIsAuthenticated(!!data.session);
    
    // If domain ID or seller ID is not provided, fetch it
    if (!domainId || !sellerId) {
      try {
        const { data: domainData } = await supabase
          .from('domain_listings')
          .select('id, owner_id')
          .eq('name', domain)
          .single();
          
        if (domainData) {
          setDomainInfo({
            id: domainData.id,
            ownerId: domainData.owner_id
          });
        }
      } catch (error) {
        console.error('Error fetching domain info:', error);
      }
    }
    
    setIsDialogOpen(true);
  };

  return (
    <div className={`relative border rounded-lg p-6 hover:shadow-md transition-shadow ${highlight ? 'border-black border-2' : 'border-gray-200'}`}>
      {highlight && (
        <div className="absolute -top-3 right-4">
          <Badge className="bg-black text-white">精选</Badge>
        </div>
      )}
      
      <div className="flex flex-col items-center space-y-4">
        <h3 className="text-2xl font-bold text-gray-900 text-center">
          {domain}
        </h3>
        
        {price !== undefined && (
          <span className="text-xl font-bold text-gray-900">${typeof price === 'number' ? price.toLocaleString() : price}</span>
        )}
        
        {category && (
          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm">
            {category}
          </span>
        )}
        
        {description && (
          <p className="text-sm text-gray-600 text-center line-clamp-2 mt-2">
            {description}
          </p>
        )}
        
        {isSold ? (
          <span className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 font-semibold">
            已售出
          </span>
        ) : (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full bg-black text-white hover:bg-gray-800 font-bold text-base shadow-md"
                onClick={handleOpenDialog}
              >
                我要报价
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-gray-200 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center text-gray-900">
                  {domain} - 提交报价
                </DialogTitle>
              </DialogHeader>
              <DomainOfferForm 
                domain={domain}
                domainId={domainInfo.id}
                sellerId={domainInfo.ownerId}
                onClose={() => setIsDialogOpen(false)}
                isAuthenticated={isAuthenticated}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};
