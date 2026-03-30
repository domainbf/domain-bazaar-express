import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Mail, Users, Shield, Book, MessageCircle, ArrowRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

const HELP_SECTIONS = [
  {
    icon: Book,
    title: '常见问题',
    desc: '快速找到注册、交易、域名验证等高频问题的解答。',
    href: '/faq',
    color: 'text-blue-600 bg-blue-500/15 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    icon: Mail,
    title: '联系我们',
    desc: '发送邮件或填写联系表单，我们在工作日 24 小时内回复。',
    href: '/contact',
    color: 'text-green-600 bg-green-500/15 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    icon: Users,
    title: '用户社区',
    desc: '加入域名交易者社区，分享经验、获取建议、结交同好。',
    href: '/community',
    color: 'text-purple-600 bg-purple-500/15 dark:bg-purple-900/30 dark:text-purple-400',
  },
  {
    icon: Shield,
    title: '安全中心',
    desc: '了解账号安全、交易安全和资金保护的最佳实践。',
    href: '/security-center',
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
  },
  {
    icon: MessageCircle,
    title: '纠纷申诉',
    desc: '遇到交易纠纷？提交申诉，平台介入保障你的权益。',
    href: '/dispute',
    color: 'text-red-600 bg-red-500/15 dark:bg-red-900/30 dark:text-red-400',
  },
  {
    icon: HelpCircle,
    title: '平台服务',
    desc: '了解资金托管、域名验证等平台核心服务的使用方法。',
    href: '/platform-services',
    color: 'text-teal-600 bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400',
  },
];

const QUICK_TOPICS = [
  { q: '如何注册账号？', href: '/faq#register' },
  { q: '如何上架域名？', href: '/seller' },
  { q: '域名验证怎么做？', href: '/faq#verification' },
  { q: '资金托管流程？', href: '/escrow' },
  { q: '如何批量上架？', href: '/bulk-listing' },
  { q: '遇到纠纷怎么办？', href: '/dispute' },
  { q: '如何修改密码？', href: '/faq#security' },
  { q: '拍卖如何参与？', href: '/auctions' },
];

export default function HelpPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = QUICK_TOPICS.filter(t => t.q.includes(search));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="pt-16 pb-10 px-4 text-center border-b border-border/50">
          <div className="max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-4">帮助中心</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">我们能帮您什么？</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-6">
              搜索问题或浏览以下分类，快速找到你需要的帮助。
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="搜索问题，例如：如何上架域名"
                value={search}
                onChange={e => setSearch(e.target.value)}
                data-testid="input-help-search"
              />
            </div>
          </div>
        </section>

        {search && (
          <section className="py-6 px-4 border-b border-border/50">
            <div className="max-w-3xl mx-auto">
              <p className="text-sm text-muted-foreground mb-3">搜索结果</p>
              {filtered.length ? (
                <div className="space-y-2">
                  {filtered.map(t => (
                    <button
                      key={t.q}
                      onClick={() => navigate(t.href)}
                      className="w-full text-left flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/40 transition-colors text-sm"
                      data-testid={`button-topic-${t.q}`}
                    >
                      <span>{t.q}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-sm">未找到相关内容，请</p>
                  <Button variant="link" onClick={() => navigate('/contact')} className="text-sm">联系客服</Button>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-lg font-semibold mb-6">帮助分类</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {HELP_SECTIONS.map((s) => (
                <button
                  key={s.title}
                  onClick={() => navigate(s.href)}
                  className="bg-card rounded-xl border border-border p-5 text-left flex gap-4 hover:border-primary/40 transition-colors group"
                  data-testid={`button-help-${s.title}`}
                >
                  <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl shrink-0 ${s.color}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm mb-0.5">{s.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{s.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 px-4 bg-muted/30 border-t border-border/50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">快速问题导航</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_TOPICS.map(t => (
                <button
                  key={t.q}
                  onClick={() => navigate(t.href)}
                  className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3 text-sm hover:border-primary/40 transition-colors text-left"
                  data-testid={`button-quick-${t.q}`}
                >
                  <span>{t.q}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">还是没找到答案？</p>
              <Button onClick={() => navigate('/contact')} data-testid="button-help-contact">
                <Mail className="h-4 w-4 mr-2" />
                联系我们
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
