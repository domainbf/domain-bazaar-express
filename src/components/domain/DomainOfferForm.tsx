
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
      if (!domainId || !sellerId) {
        throw new Error('Domain information is missing');
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session && isAuthenticated) {
        throw new Error('You must be logged in to make an offer');
      }

      const offerData = {
        domain_id: domainId,
        amount: parseFloat(offer),
        message: message,
        contact_email: email,
        seller_id: sellerId,
        buyer_id: session?.user.id
      };

      // If user is logged in, save the offer to the database
      if (session) {
        const { error } = await supabase
          .from('domain_offers')
          .insert([offerData]);
        
        if (error) throw error;
      }
      
      // Send email notification regardless of authentication
      const { error: emailError } = await supabase.functions.invoke('send-offer', {
        body: {
          domain,
          offer,
          email,
          message,
          buyerId: session?.user.id || null
        }
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
        // Continue execution even if email fails
      }

      toast.success('Your offer has been submitted successfully!');
      setOffer('');
      setEmail('');
      setMessage('');
      onClose();
    } catch (error: any) {
      console.error('Error submitting offer:', error);
      toast.error(error.message || 'Failed to submit offer');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      {!isAuthenticated && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mb-4">
          <p className="text-yellow-800 text-sm">
            You are not signed in. Your offer will still be sent to the seller, but creating an account lets you track your offers.
          </p>
        </div>
      )}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Your Offer</label>
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
        <label className="text-sm font-medium text-gray-700">Contact Email</label>
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
        <label className="text-sm font-medium text-gray-700">Message (Optional)</label>
        <textarea
          placeholder="Add any details about your offer..."
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
            Submitting...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Submit Offer
          </span>
        )}
      </Button>
    </form>
  );
};
