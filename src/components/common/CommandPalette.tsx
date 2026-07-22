import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/currency';
import {
  Search,
  Globe,
  Store,
  Gavel,
  LayoutDashboard,
  Package,
  Bell,
  Settings,
  Shield,
  HelpCircle,
  Sparkles,
  History,
  LogIn,
  User,
  ArrowRight,
  Tag,
} from 'lucide-react';

interface DomainHit {
  id: string;
  name: string;
  price: number | null;
  currency: string | null;
  status: string | null;
}

const RECENT_KEY = 'cmdk_recent_domains_v1';

function loadRecent(): DomainHit[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function pushRecent(item: DomainHit) {
  try {
    const list = loadRecent().filter((r) => r.id !== item.id);
    list.unshift(item);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 6)));
  } catch {
    /* noop */
  }
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DomainHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<DomainHit[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const debounceRef = useRef<number | null>(null);

  // Global shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const t = e.target as HTMLElement | null;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) setRecent(loadRecent());
  }, [open]);

  // Debounced domain search
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      const { data } = await supabase
        .from('domains')
        .select('id, name, price, currency, status')
        .ilike('name', `%${q}%`)
        .limit(8);
      setResults((data as DomainHit[] | null) ?? []);
      setLoading(false);
    }, 180);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  const go = useCallback(
    (path: string) => {
      setOpen(false);
      setQuery('');
      navigate(path);
    },
    [navigate],
  );

  const openDomain = useCallback(
    (d: DomainHit) => {
      pushRecent(d);
      go(`/domain/${encodeURIComponent(d.name)}`);
    },
    [go],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="搜索域名、跳转页面…（⌘K / Ctrl K）"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? '正在搜索…' : query ? '没有匹配结果' : '输入关键词开始搜索'}
        </CommandEmpty>

        {results.length > 0 && (
          <CommandGroup heading="域名结果">
            {results.map((d) => (
              <CommandItem
                key={d.id}
                value={`domain-${d.name}`}
                onSelect={() => openDomain(d)}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="font-mono uppercase tracking-tight truncate">{d.name}</span>
                  {d.status && d.status !== 'available' && (
                    <span className="text-[10px] uppercase text-muted-foreground border rounded px-1 py-0.5">
                      {d.status}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 text-xs tabular-nums text-muted-foreground">
                  {typeof d.price === 'number' && d.price > 0 && (
                    <span>{formatPrice(d.price, (d.currency as any) || 'CNY')}</span>
                  )}
                  <ArrowRight className="h-3 w-3" />
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!query && recent.length > 0 && (
          <>
            <CommandGroup heading="最近查看">
              {recent.map((d) => (
                <CommandItem
                  key={`recent-${d.id}`}
                  value={`recent-${d.name}`}
                  onSelect={() => openDomain(d)}
                >
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono uppercase truncate">{d.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="快速跳转">
          <CommandItem value="nav-market" onSelect={() => go('/marketplace')}>
            <Store className="h-4 w-4" /> 域名市场
          </CommandItem>
          <CommandItem value="nav-auctions" onSelect={() => go('/auctions')}>
            <Gavel className="h-4 w-4" /> 拍卖专区
          </CommandItem>
          <CommandItem value="nav-launchpad" onSelect={() => go('/launchpad')}>
            <LayoutDashboard className="h-4 w-4" /> Launchpad 仪表盘
          </CommandItem>
          <CommandItem value="nav-valuation" onSelect={() => go('/valuation')}>
            <Sparkles className="h-4 w-4" /> AI 估值工具
          </CommandItem>
          <CommandItem value="nav-help" onSelect={() => go('/help')}>
            <HelpCircle className="h-4 w-4" /> 帮助中心
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="我的账户">
          {user ? (
            <>
              <CommandItem value="me-domains" onSelect={() => go('/my-domains')}>
                <Package className="h-4 w-4" /> 我的域名
              </CommandItem>
              <CommandItem value="me-sell" onSelect={() => go('/sell')}>
                <Tag className="h-4 w-4" /> 上架出售
              </CommandItem>
              <CommandItem value="me-user-center" onSelect={() => go('/user-center')}>
                <User className="h-4 w-4" /> 用户中心
              </CommandItem>
              <CommandItem value="me-notifications" onSelect={() => go('/notifications')}>
                <Bell className="h-4 w-4" /> 通知中心
              </CommandItem>
              <CommandItem value="me-security" onSelect={() => go('/security-center')}>
                <Shield className="h-4 w-4" /> 安全中心
              </CommandItem>
              <CommandItem value="me-profile" onSelect={() => go('/profile')}>
                <Settings className="h-4 w-4" /> 账户设置
              </CommandItem>
            </>
          ) : (
            <CommandItem value="me-login" onSelect={() => go('/auth')}>
              <LogIn className="h-4 w-4" /> 登录 / 注册
            </CommandItem>
          )}
        </CommandGroup>

        {query && (
          <>
            <CommandSeparator />
            <CommandGroup heading="操作">
              <CommandItem
                value="action-search-market"
                onSelect={() => go(`/marketplace?q=${encodeURIComponent(query)}`)}
              >
                <Search className="h-4 w-4" /> 在市场中搜索 "{query}"
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export default CommandPalette;
