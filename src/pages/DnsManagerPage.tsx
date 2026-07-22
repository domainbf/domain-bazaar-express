import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AdvancedDnsEditor from '@/components/domain/AdvancedDnsEditor';
import { Globe2, ChevronLeft, Info } from 'lucide-react';

export default function DnsManagerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [domains, setDomains] = useState<{ id: string; name: string }[]>([]);
  const active = params.get('name') ?? '';

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('domain_listings')
        .select('id, name')
        .eq('owner_id', user.id)
        .order('name');
      setDomains((data ?? []) as any);
      if (!active && data && data.length) {
        setParams({ name: (data[0] as any).name }, { replace: true });
      }
    })();
    // eslint-disable-next-line
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8">
          <Card><CardContent className="p-8 text-center">
            <Globe2 className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="mb-4 text-sm">请先登录以管理 DNS</p>
            <Button onClick={() => navigate('/auth')}>去登录</Button>
          </CardContent></Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-6 space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4 mr-1" />返回
          </Button>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Globe2 className="h-5 w-5" /> DNS 管理
          </h1>
        </div>

        <Card className="border-border/60">
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            <label className="text-sm text-muted-foreground">选择域名</label>
            <Select
              value={active}
              onValueChange={(v) => setParams({ name: v })}
            >
              <SelectTrigger className="w-64"><SelectValue placeholder="选择一个域名" /></SelectTrigger>
              <SelectContent>
                {domains.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Info className="h-3.5 w-3.5" />
              仅您拥有的域名可管理 DNS
            </div>
          </CardContent>
        </Card>

        {active && user && (
          <AdvancedDnsEditor domainName={active} ownerId={user.id} />
        )}

        {!domains.length && (
          <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">
            您暂无可管理的域名。<Button variant="link" onClick={() => navigate('/user-center?tab=domains&new=1')}>去上架</Button>
          </CardContent></Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
