
import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminStats } from '@/types/domain';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { PendingVerifications } from '@/components/admin/PendingVerifications';
import { AllDomainListings } from '@/components/admin/AllDomainListings';
import { UserManagement } from '@/components/admin/UserManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield } from 'lucide-react';

export const AdminPanel = () => {
  const [stats, setStats] = useState<AdminStats>({
    total_domains: 0,
    pending_verifications: 0,
    active_listings: 0,
    total_offers: 0,
    recent_transactions: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    setIsLoading(true);
    try {
      // Get total domains
      const { data: domains, error: domainsError } = await supabase
        .from('domain_listings')
        .select('id', { count: 'exact' });
      
      if (domainsError) throw domainsError;
      
      // Get pending verifications
      const { data: verifications, error: verificationsError } = await supabase
        .from('domain_verifications')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');
      
      if (verificationsError) throw verificationsError;
      
      // Get active listings
      const { data: activeListings, error: activeListingsError } = await supabase
        .from('domain_listings')
        .select('id', { count: 'exact' })
        .eq('status', 'available');
      
      if (activeListingsError) throw activeListingsError;
      
      // Get total offers
      const { data: offers, error: offersError } = await supabase
        .from('domain_offers')
        .select('id', { count: 'exact' });
      
      if (offersError) throw offersError;
      
      setStats({
        total_domains: domains?.length || 0,
        pending_verifications: verifications?.length || 0,
        active_listings: activeListings?.length || 0,
        total_offers: offers?.length || 0,
        recent_transactions: 0, // This would require more complex query
      });
    } catch (error: any) {
      console.error('Error loading admin stats:', error);
      toast.error(error.message || 'Failed to load admin statistics');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        </div>
        
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="verifications">Pending Verifications</TabsTrigger>
            <TabsTrigger value="domains">All Domains</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <AdminDashboard stats={stats} isLoading={isLoading} onRefresh={loadAdminStats} />
          </TabsContent>
          
          <TabsContent value="verifications">
            <PendingVerifications />
          </TabsContent>
          
          <TabsContent value="domains">
            <AllDomainListings />
          </TabsContent>
          
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
