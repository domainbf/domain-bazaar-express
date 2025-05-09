
import { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DomainListing } from '@/types/domain';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Star, Check, RefreshCw, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const AllDomainListings = () => {
  const { t } = useTranslation();
  const [domains, setDomains] = useState<DomainListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('domain_listings')
        .select('*, domain_analytics(views, favorites, offers), profiles!domain_listings_owner_id_fkey(username, full_name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Process the data to include analytics
      const processedDomains = data?.map(domain => {
        const analyticsData = domain.domain_analytics?.[0];
        const ownerData = domain.profiles;
        
        // Extract analytics data
        const views = analyticsData?.views || 0;
        const favorites = analyticsData?.favorites || 0;
        const offers = analyticsData?.offers || 0;
        
        // Extract owner info
        const ownerName = ownerData?.username || ownerData?.full_name || t('common.unknown', '未知');
        
        // Remove nested objects
        const { domain_analytics, profiles, ...rest } = domain;
        
        return {
          ...rest,
          views,
          favorites,
          offers,
          ownerName
        };
      }) || [];
      
      setDomains(processedDomains);
    } catch (error: any) {
      console.error('Error loading domains:', error);
      toast.error(t('admin.domains.loadError', 'Failed to load domains'));
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDomains = async () => {
    setIsRefreshing(true);
    await loadDomains();
    setIsRefreshing(false);
  };

  const toggleHighlight = async (domain: DomainListing) => {
    try {
      const { error } = await supabase
        .from('domain_listings')
        .update({ highlight: !domain.highlight })
        .eq('id', domain.id);
      
      if (error) throw error;
      
      // Update local state
      setDomains(domains.map(d => 
        d.id === domain.id ? { ...d, highlight: !domain.highlight } : d
      ));
      
      toast.success(
        domain.highlight 
          ? t('admin.domains.removedHighlight', 'Domain removed from featured listings')
          : t('admin.domains.addedHighlight', 'Domain added to featured listings')
      );
    } catch (error: any) {
      console.error('Error toggling highlight:', error);
      toast.error(t('admin.domains.updateError', 'Failed to update domain'));
    }
  };

  const updateDomainStatus = async (domain: DomainListing, status: string) => {
    try {
      const { error } = await supabase
        .from('domain_listings')
        .update({ status })
        .eq('id', domain.id);
      
      if (error) throw error;
      
      // Update local state
      setDomains(domains.map(d => 
        d.id === domain.id ? { ...d, status } : d
      ));
      
      toast.success(t('admin.domains.statusUpdated', 'Domain status updated to {{status}}', { status }));
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(t('admin.domains.statusUpdateError', 'Failed to update domain status'));
    }
  };

  const filteredDomains = useMemo(() => {
    return domains.filter(domain => {
      // Apply search query filter
      const matchesSearch = 
        searchQuery === '' ||
        domain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (domain.description && domain.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (domain.ownerName && domain.ownerName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Apply status filter
      const matchesStatus = 
        statusFilter === 'all' ||
        domain.status === statusFilter;
        
      // Apply verification filter
      const matchesVerification = 
        verificationFilter === 'all' ||
        (verificationFilter === 'verified' && domain.verification_status === 'verified') ||
        (verificationFilter === 'pending' && domain.verification_status === 'pending') ||
        (verificationFilter === 'none' && (!domain.verification_status || domain.verification_status === 'none'));
      
      return matchesSearch && matchesStatus && matchesVerification;
    });
  }, [domains, searchQuery, statusFilter, verificationFilter]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t('admin.domains.allListings', 'All Domain Listings')}</h2>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={refreshDomains}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('common.refresh', 'Refresh')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex gap-2 items-center">
          <Search className="h-4 w-4 text-gray-500" />
          <Input 
            placeholder={t('admin.domains.searchPlaceholder', 'Search domains...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder={t('admin.domains.filterByStatus', 'Filter by status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all', 'All')}</SelectItem>
            <SelectItem value="available">{t('domains.status.available', 'Available')}</SelectItem>
            <SelectItem value="sold">{t('domains.status.sold', 'Sold')}</SelectItem>
            <SelectItem value="reserved">{t('domains.status.reserved', 'Reserved')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={verificationFilter} onValueChange={setVerificationFilter}>
          <SelectTrigger>
            <SelectValue placeholder={t('admin.domains.filterByVerification', 'Filter by verification')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all', 'All')}</SelectItem>
            <SelectItem value="verified">{t('domains.verification.verified', 'Verified')}</SelectItem>
            <SelectItem value="pending">{t('domains.verification.pending', 'Pending')}</SelectItem>
            <SelectItem value="none">{t('domains.verification.none', 'Not Verified')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-4 border-b">{t('domains.name', 'Domain')}</th>
              <th className="text-left p-4 border-b">{t('domains.price', 'Price')}</th>
              <th className="text-left p-4 border-b">{t('domains.owner', 'Owner')}</th>
              <th className="text-left p-4 border-b">{t('domains.category', 'Category')}</th>
              <th className="text-left p-4 border-b">{t('domains.status', 'Status')}</th>
              <th className="text-left p-4 border-b">{t('domains.verification', 'Verification')}</th>
              <th className="text-left p-4 border-b">{t('domains.stats', 'Stats')}</th>
              <th className="text-left p-4 border-b">{t('domains.created', 'Created')}</th>
              <th className="text-left p-4 border-b">{t('common.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredDomains.map((domain) => (
              <tr key={domain.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {domain.name}
                    {domain.highlight && (
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    )}
                  </div>
                </td>
                <td className="p-4">¥{domain.price}</td>
                <td className="p-4">{domain.ownerName}</td>
                <td className="p-4 capitalize">{t(`domains.categories.${domain.category}`, domain.category)}</td>
                <td className="p-4 capitalize">{t(`domains.status.${domain.status}`, domain.status)}</td>
                <td className="p-4">
                  {domain.verification_status === 'verified' ? (
                    <span className="inline-flex items-center text-green-600">
                      <Check className="h-4 w-4 mr-1" />
                      {t('domains.verification.verified', 'Verified')}
                    </span>
                  ) : domain.verification_status === 'pending' ? (
                    <span className="text-yellow-600">{t('domains.verification.pending', 'Pending')}</span>
                  ) : (
                    <span className="text-gray-500">{t('domains.verification.none', 'Not Verified')}</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="text-xs">{t('domains.stats.views', 'Views')}: {domain.views || 0}</span>
                    <span className="text-xs">{t('domains.stats.favorites', 'Favorites')}: {domain.favorites || 0}</span>
                    <span className="text-xs">{t('domains.stats.offers', 'Offers')}: {domain.offers || 0}</span>
                  </div>
                </td>
                <td className="p-4">
                  {new Date(domain.created_at).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white">
                      <DropdownMenuItem onClick={() => toggleHighlight(domain)}>
                        {domain.highlight 
                          ? t('admin.domains.removeFeatured', 'Remove Featured') 
                          : t('admin.domains.markAsFeatured', 'Mark as Featured')
                        }
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateDomainStatus(domain, 'available')}>
                        {t('admin.domains.setAvailable', 'Set as Available')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateDomainStatus(domain, 'sold')}>
                        {t('admin.domains.markAsSold', 'Mark as Sold')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateDomainStatus(domain, 'reserved')}>
                        {t('admin.domains.markAsReserved', 'Mark as Reserved')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredDomains.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">{t('admin.domains.noDomains', 'No domains found')}</p>
        </div>
      )}
    </div>
  );
};
