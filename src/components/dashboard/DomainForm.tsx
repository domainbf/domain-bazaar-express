
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DomainListing } from "@/types/domain";

interface DomainFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  editingDomain: DomainListing | null;
}

export const DomainForm = ({ isOpen, onClose, onSuccess, editingDomain }: DomainFormProps) => {
  const [domainName, setDomainName] = useState('');
  const [domainPrice, setDomainPrice] = useState('');
  const [domainDescription, setDomainDescription] = useState('');
  const [domainCategory, setDomainCategory] = useState('standard');
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (editingDomain) {
      setDomainName(editingDomain.name);
      setDomainPrice(editingDomain.price.toString());
      setDomainDescription(editingDomain.description || '');
      setDomainCategory(editingDomain.category || 'standard');
      setIsHighlighted(editingDomain.highlight);
    } else {
      resetForm();
    }
  }, [editingDomain, isOpen]);

  const resetForm = () => {
    setDomainName('');
    setDomainPrice('');
    setDomainDescription('');
    setDomainCategory('standard');
    setIsHighlighted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const domainData = {
        name: domainName,
        price: parseFloat(domainPrice),
        description: domainDescription,
        category: domainCategory,
        highlight: isHighlighted,
        owner_id: user.id
      };

      if (editingDomain) {
        // Update existing domain
        const { error } = await supabase
          .from('domain_listings')
          .update(domainData)
          .eq('id', editingDomain.id);
        
        if (error) throw error;
        toast.success('Domain updated successfully');
      } else {
        // Add new domain
        const { error } = await supabase
          .from('domain_listings')
          .insert([domainData]);
        
        if (error) throw error;
        toast.success('Domain added successfully');
      }

      // Reset form and close dialog
      resetForm();
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error('Error saving domain:', error);
      toast.error(error.message || 'Failed to save domain');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Domain Name</label>
        <Input
          value={domainName}
          onChange={(e) => setDomainName(e.target.value)}
          required
          className="bg-white border-gray-300"
          placeholder="example.com"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Price ($)</label>
        <Input
          type="number"
          value={domainPrice}
          onChange={(e) => setDomainPrice(e.target.value)}
          required
          className="bg-white border-gray-300"
          placeholder="1000"
          min="1"
          step="0.01"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={domainDescription}
          onChange={(e) => setDomainDescription(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-md p-2 text-black"
          placeholder="Describe your domain (optional)"
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Category</label>
        <select
          value={domainCategory}
          onChange={(e) => setDomainCategory(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-md p-2 text-black"
        >
          <option value="standard">Standard</option>
          <option value="premium">Premium</option>
          <option value="short">Short</option>
          <option value="dev">Development</option>
          <option value="brandable">Brandable</option>
        </select>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="highlight"
          checked={isHighlighted}
          onChange={(e) => setIsHighlighted(e.target.checked)}
          className="rounded border-gray-300"
        />
        <label htmlFor="highlight" className="text-sm font-medium text-gray-700">
          Highlight this domain (featured)
        </label>
      </div>
      <Button 
        type="submit"
        disabled={formLoading}
        className="w-full bg-black text-white hover:bg-gray-800"
      >
        {formLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin w-4 h-4" />
            Saving...
          </span>
        ) : (
          editingDomain ? 'Update Domain' : 'Add Domain'
        )}
      </Button>
    </form>
  );
};
