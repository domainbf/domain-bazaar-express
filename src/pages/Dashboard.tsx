import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Package, Inbox, Send, Eye, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Navbar } from '@/components/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DomainListingsTable } from '@/components/dashboard/DomainListingsTable';
import { ReceivedOffersTable } from '@/components/dashboard/ReceivedOffersTable';
import { SentOffersTable } from '@/components/dashboard/SentOffersTable';
import { DomainForm } from '@/components/dashboard/DomainForm';
import { DomainListing, DomainOffer } from '@/types/domain';
import { Badge } from '@/components/ui/badge';

interface DashboardStats {
  totalListings: number;
  pendingOffers: number;
  totalViews: number;
  completedDeals: number;
}

export const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [myDomains, setMyDomains] = useState<DomainListing[]>([]);
  const [receivedOffers, setReceivedOffers] = useState<DomainOffer[]>([]);
  const [sentOffers, setSentOffers] = useState<DomainOffer[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalListings: 0, pendingOffers: 0, totalViews: 0, completedDeals: 0 });
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainListing | null>(null);
  const navigate = useNavigate();
  const { user, session, isLoading: authLoading } = useAuth();

  const loadData = async () => {
    try {
      const [domains, received, sent, transactions] = await Promise.all([
        apiGet<DomainListing[]>('/data/my-domains'),
        apiGet<DomainOffer[]>('/data/domain-offers?role=seller'),
        apiGet<DomainOffer[]>('/data/domain-offers?role=buyer'),
        apiGet<{ id: string }[]>('/data/transactions'),
      ]);

      setMyDomains(domains || []);
      setReceivedOffers(received || []);
      setSentOffers(sent || []);

      setStats({
        totalListings: (domains || []).length,
        pendingOffers: (received || []).filter((o: any) => o.status === 'pending').length,
        totalViews: (domains || []).reduce((sum: number, d: any) => sum + (d.views || 0), 0),
        completedDeals: (transactions || []).length,
      });
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast.error(error.message || '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user && !session) { navigate('/auth'); return; }
    loadData();
  }, [authLoading, user]);

  const handleEditDomain = (domain: DomainListing) => {
    setEditingDomain(domain);
    setIsAddDomainOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">卖家控制台</h1>
            <p className="text-sm text-muted-foreground mt-0.5">管理您的域名和交易</p>
          </div>
          <Button
            id="add-domain-button"
            data-testid="button-add-domain"
            onClick={() => { setEditingDomain(null); setIsAddDomainOpen(true); }}
          >
            <Plus className="w-4 h-4 mr-2" />
            上架域名
          </Button>
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-card border border-border rounded-xl p-4" data-testid="stat-listings">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 dark:bg-blue-900/30 flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs text-muted-foreground">在售域名</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalListings}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 relative" data-testid="stat-pending-offers">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Inbox className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-xs text-muted-foreground">待处理报价</span>
              {stats.pendingOffers > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 ml-auto">
                  {stats.pendingOffers}
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold">{stats.pendingOffers}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4" data-testid="stat-views">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 dark:bg-purple-900/30 flex items-center justify-center">
                <Eye className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs text-muted-foreground">总浏览量</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4" data-testid="stat-completed">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-green-500/15 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs text-muted-foreground">已完成交易</span>
            </div>
            <p className="text-2xl font-bold">{stats.completedDeals}</p>
          </div>
        </div>

        {/* Pending offers alert */}
        {stats.pendingOffers > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-orange-500/10 dark:bg-orange-950/30 border border-orange-500/30 dark:border-orange-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                您有 <strong>{stats.pendingOffers}</strong> 条待回复的报价，请及时处理
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-orange-700 border-orange-300 hover:bg-orange-100 dark:text-orange-400 dark:border-orange-700"
              onClick={() => document.querySelector('[data-value="received"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))}
            >
              立即查看
            </Button>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="domains" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="domains" data-testid="tab-my-domains">
              <Package className="h-4 w-4 mr-1.5" />
              我的域名
              {myDomains.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{myDomains.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="received" data-value="received" data-testid="tab-received-offers">
              <Inbox className="h-4 w-4 mr-1.5" />
              收到的报价
              {stats.pendingOffers > 0 && (
                <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5">{stats.pendingOffers}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" data-testid="tab-sent-offers">
              <Send className="h-4 w-4 mr-1.5" />
              发出的报价
            </TabsTrigger>
          </TabsList>

          <TabsContent value="domains">
            <DomainListingsTable domains={myDomains} onEdit={handleEditDomain} onRefresh={loadData} />
          </TabsContent>
          <TabsContent value="received">
            <ReceivedOffersTable offers={receivedOffers} onRefresh={loadData} />
          </TabsContent>
          <TabsContent value="sent">
            <SentOffersTable offers={sentOffers} onRefresh={loadData} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isAddDomainOpen} onOpenChange={setIsAddDomainOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              {editingDomain ? '编辑域名' : '上架新域名'}
            </DialogTitle>
          </DialogHeader>
          <DomainForm
            isOpen={isAddDomainOpen}
            onClose={() => setIsAddDomainOpen(false)}
            onSuccess={loadData}
            editingDomain={editingDomain}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
