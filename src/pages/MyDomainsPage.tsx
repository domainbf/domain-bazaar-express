import { Navbar } from '@/components/Navbar';
import { DomainManagement } from '@/components/usercenter/DomainManagement';
import { useNotifications } from '@/hooks/useNotifications';
import { useIsMobile } from '@/hooks/use-mobile';
import { Globe, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function MyDomainsPage() {
  const { unreadCount } = useNotifications();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar unreadCount={unreadCount} />

      <div className={`flex-1 max-w-7xl mx-auto w-full px-4 py-6 ${isMobile ? 'pb-24' : ''}`}>
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/user-center?tab=profile')}
          >
            <ChevronLeft className="h-4 w-4" />
            用户中心
          </Button>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-foreground" />
            <h1 className="text-xl font-bold text-foreground">我的域名</h1>
          </div>
        </div>

        <DomainManagement />
      </div>
    </div>
  );
}
