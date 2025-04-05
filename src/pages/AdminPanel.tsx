
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, ArrowUpRight, BarChart3, CheckCircle, FileText, Settings, Shield, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AllDomainListings } from '@/components/admin/AllDomainListings';
import { UserManagement } from '@/components/admin/UserManagement';
import { PendingVerifications } from '@/components/admin/PendingVerifications';
import { SiteSettings } from '@/components/admin/SiteSettings';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Use the predefined AdminStats interface instead of redefining it
type AdminDashboardProps = {
  stats: AdminStats;
  isLoading: boolean;
  onRefresh: () => void;
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [stats, setStats] = useState<AdminStats>({
    users_count: 0,
    total_domains: 0,
    active_listings: 0,
    sold_domains: 0,
    verification_pending: 0,
    monthly_revenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Set active tab based on URL hash if present
    const hash = location.hash.replace('#', '');
    if (hash) {
      setActiveTab(hash);
    }
    
    fetchStats();
  }, [location]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      // In a real application, we would fetch these from an API
      const { data: usersCount, error: usersError } = await supabase
        .from('users_view')
        .select('count')
        .single();
        
      const { data: domainStats, error: domainError } = await supabase
        .from('domain_stats')
        .select('*')
        .single();
        
      if (usersError || domainError) {
        throw new Error('Failed to fetch admin stats');
      }
      
      setStats({
        users_count: usersCount?.count || 0,
        total_domains: domainStats?.total || 0,
        active_listings: domainStats?.active || 0,
        sold_domains: domainStats?.sold || 0,
        verification_pending: domainStats?.pending_verification || 0,
        monthly_revenue: domainStats?.monthly_revenue || 0
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast.error('Failed to load admin statistics');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute adminOnly>
      <div className="container py-10">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
              <p className="text-muted-foreground">
                Manage domains, users, and site settings
              </p>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value);
            navigate(`#${value}`);
          }}>
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="domains" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Domains</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Users</span>
              </TabsTrigger>
              <TabsTrigger value="verifications" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Verifications</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard">
              <AdminDashboard stats={stats} isLoading={isLoading} onRefresh={fetchStats} />
            </TabsContent>
            <TabsContent value="domains">
              <AllDomainListings />
            </TabsContent>
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
            <TabsContent value="verifications">
              <PendingVerifications />
            </TabsContent>
            <TabsContent value="settings">
              <SiteSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminPanel;
