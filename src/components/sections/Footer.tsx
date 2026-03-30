import { Link } from 'react-router-dom';
import {
  Globe, Shield, MessageSquare, Mail, Github, Twitter,
  ShoppingBag, BarChart2, Bell, Gavel, Layers,
  Lock, UserPlus, Upload, Scale, HelpCircle,
  Users, Phone, FileText, AlertTriangle, BookOpen
} from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Separator } from '@/components/ui/separator';

export const Footer = () => {
  const { config } = useSiteSettings();
  const year = new Date().getFullYear();

  const links = {
    marketplace: [
      { label: '域名市场', to: '/marketplace', icon: ShoppingBag },
      { label: '价值评估', to: '/valuation', icon: BarChart2 },
      { label: '域名监控', to: '/domain-monitor', icon: Bell },
      { label: '拍卖列表', to: '/auctions', icon: Gavel },
      { label: '平台服务', to: '/platform-services', icon: Layers },
    ],
    services: [
      { label: '资金托管', to: '/escrow', icon: Lock },
      { label: '卖家入驻', to: '/seller', icon: UserPlus },
      { label: '批量上架', to: '/bulk-listing', icon: Upload },
      { label: '纠纷申诉', to: '/dispute', icon: Scale },
      { label: '帮助支持', to: '/help', icon: HelpCircle },
    ],
    support: [
      { label: '常见问题', to: '/faq', icon: MessageSquare },
      { label: '联系我们', to: '/contact', icon: Phone },
      { label: '社区', to: '/community', icon: Users },
      { label: '安全中心', to: '/security-center', icon: Shield },
    ],
    legal: [
      { label: '服务协议', to: '/terms', icon: FileText },
      { label: '隐私政策', to: '/privacy', icon: BookOpen },
      { label: '免责声明', to: '/disclaimer', icon: AlertTriangle },
    ],
  };

  const stats = [
    { label: '在售域名', value: '1,000+' },
    { label: '注册用户', value: '5,000+' },
    { label: '成功交易', value: '200+' },
    { label: '平均评分', value: '4.9★' },
  ];

  return (
    <footer className="bg-card border-t border-border">
      {/* 统计栏 */}
      <div className="border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {stats.map((s, i) => (
              <div key={i}>
                <p className="text-2xl font-bold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 主要链接区域 */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">

          {/* 域名交易 */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />域名交易
            </h4>
            <ul className="space-y-2">
              {links.marketplace.map(l => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                    <l.icon className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 平台服务 */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />平台服务
            </h4>
            <ul className="space-y-2">
              {links.services.map(l => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                    <l.icon className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 帮助支持 */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />帮助支持
            </h4>
            <ul className="space-y-2">
              {links.support.map(l => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                    <l.icon className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 法律条款 */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />法律条款
            </h4>
            <ul className="space-y-2">
              {links.legal.map(l => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                    <l.icon className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 品牌介绍 — 移至最右列 */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">{config?.site_name ?? 'NIC.BN'}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              专业域名交易平台，提供安全可靠的买卖撮合、资金托管和纠纷调解服务。
            </p>
            <div className="flex gap-3 mt-4">
              {config?.contact_email ? (
                <a href={`mailto:${config.contact_email}`} className="text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="h-5 w-5" />
                </a>
              ) : (
                <a href="mailto:support@nic.bn" className="text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="h-5 w-5" />
                </a>
              )}
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* 底部版权 */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {year} {config?.footer_text ?? `${config?.site_name ?? 'NIC.BN'} 版权所有`}</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-green-500" />
              安全 · 可信 · 高效
            </span>
            <span>资金托管保障交易安全</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
