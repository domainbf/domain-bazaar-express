
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { DomainOfferForm } from './domain/DomainOfferForm';

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

  // Check if user is authenticated when dialog opens
  const handleOpenDialog = async () => {
    const { data } = await supabase.auth.getSession();
    setIsAuthenticated(!!data.session);
    
    if (data.session) {
      // Pre-fill email if user is authenticated
      const userEmail = data.session.user.email;
      if (userEmail) {
        // The email field will be handled by the DomainOfferForm
      }
    }
    
    setIsDialogOpen(true);
  };

  return (
    <div className={`simple-card p-6 hover:shadow-md ${highlight ? 'border-black border-2' : ''}`}>
      <div className="flex flex-col items-center space-y-4">
        <h3 className="text-2xl font-bold text-gray-900">
          {domain}
        </h3>
        
        {price && (
          <span className="text-xl font-bold text-gray-900">${typeof price === 'number' ? price : price}</span>
        )}
        
        {category && (
          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm">
            {category}
          </span>
        )}
        
        {description && (
          <p className="text-sm text-gray-600 text-center line-clamp-2">
            {description}
          </p>
        )}
        
        {isSold ? (
          <span className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 font-semibold">
            Sold
          </span>
        ) : (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full bg-black text-white hover:bg-gray-800 font-bold text-base shadow-md"
                onClick={handleOpenDialog}
              >
                Make Offer
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-gray-200 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center text-gray-900">
                  {domain} - Make an Offer
                </DialogTitle>
              </DialogHeader>
              <DomainOfferForm 
                domain={domain}
                domainId={domainId}
                sellerId={sellerId}
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
