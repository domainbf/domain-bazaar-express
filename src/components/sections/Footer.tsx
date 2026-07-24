import { Link } from 'react-router-dom';
import {
  Globe, Shield, MessageSquare, Mail, Github, Twitter,
  ShoppingBag, BarChart2, Bell, Gavel, Layers,
  Lock, UserPlus, Upload, Scale, HelpCircle,
  Users, Phone, FileText, AlertTriangle, BookOpen,
  MessageCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import logoLightImg from '@/assets/logo-light.png';
import logoDarkImg from '@/assets/logo-dark.png';

export const Footer = () => {
  const { t } = useTranslation();
  const { config } = useSiteSettings();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const year = new Date().getFullYear();

  const links = {
    marketplace: [
      { label: t('footer.links.marketplace'), to: '/marketplace', icon: ShoppingBag },
      { label: t('footer.links.valuation'), to: '/valuation', icon: BarChart2 },
      { label: t('footer.links.monitor'), to: '/domain-monitor', icon: Bell },
      { label: t('footer.links.auctions'), to: '/auctions', icon: Gavel },
      { label: t('footer.links.platformServices'), to: '/platform-services', icon: Layers },
    ],
    services: [
      { label: t('footer.links.escrow'), to: '/escrow', icon: Lock },
      { label: t('footer.links.seller'), to: '/seller', icon: UserPlus },
      { label: t('footer.links.bulkListing'), to: '/bulk-listing', icon: Upload },
      { label: t('footer.links.dispute'), to: '/dispute', icon: Scale },
      { label: t('footer.links.help'), to: '/help', icon: HelpCircle },
    ],
    support: [
      { label: t('footer.links.faq'), to: '/faq', icon: MessageSquare },
      { label: t('footer.links.contact'), to: '/contact', icon: Phone },
      { label: t('footer.links.community'), to: '/community', icon: Users },
      { label: t('footer.links.security'), to: '/security-center', icon: Shield },
    ],
    legal: [
      { label: t('footer.links.terms'), to: '/terms', icon: FileText },
      { label: t('footer.links.privacy'), to: '/privacy', icon: BookOpen },
      { label: t('footer.links.disclaimer'), to: '/disclaimer', icon: AlertTriangle },
    ],
  };

  const stats = [
    { label: t('footer.stats.listings'), value: '1,000+' },
    { label: t('footer.stats.users'), value: '5,000+' },
    { label: t('footer.stats.deals'), value: '200+' },
    { label: t('footer.stats.rating'), value: '4.9★' },
  ];

  return (
    <footer className="bg-card border-t border-border">
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

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />{t('footer.marketplace')}
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

          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />{t('footer.services')}
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

          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />{t('footer.support')}
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

          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />{t('footer.legal')}
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

          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img
                src={isDark ? (config?.logo_dark_url || logoDarkImg) : (config?.logo_url || logoLightImg)}
                alt={config?.site_name ?? 'NIC.RW'}
                className="h-7 w-auto"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              <span className="text-lg font-bold">{config?.site_name ?? 'NIC.RW'}</span>
            </div>
            {config?.site_subtitle && (
              <p className="text-xs text-primary/70 mb-2">{config.site_subtitle}</p>
            )}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('footer.tagline')}
            </p>
            <div className="flex gap-3 mt-4 flex-wrap">
              {config?.contact_email && (
                <a href={`mailto:${config.contact_email}`} title={t('footer.socialTitles.email')} aria-label={t('footer.socialTitles.email')} className="text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="h-5 w-5" />
                </a>
              )}
              {config?.social_github && (
                <a href={config.social_github} target="_blank" rel="noopener noreferrer" title={t('footer.socialTitles.github')} aria-label={t('footer.socialTitles.github')} className="text-muted-foreground hover:text-primary transition-colors">
                  <Github className="h-5 w-5" />
                </a>
              )}
              {config?.social_twitter && (
                <a href={config.social_twitter} target="_blank" rel="noopener noreferrer" title={t('footer.socialTitles.twitter')} aria-label={t('footer.socialTitles.twitter')} className="text-muted-foreground hover:text-primary transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {config?.social_weibo && (
                <a href={config.social_weibo} target="_blank" rel="noopener noreferrer" title={t('footer.socialTitles.weibo')} aria-label={t('footer.socialTitles.weibo')} className="text-muted-foreground hover:text-primary transition-colors">
                  <MessageCircle className="h-5 w-5" />
                </a>
              )}
              {config?.contact_phone && (
                <a href={`tel:${config.contact_phone}`} title={t('footer.socialTitles.phone')} aria-label={t('footer.socialTitles.phone')} className="text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="max-w-6xl mx-auto px-4 py-4 pb-20 md:pb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <p>© {year} {config?.footer_text ?? `${config?.site_name ?? 'NIC.RW'} ${t('footer.copyrightSuffix')}`}</p>
            {config?.icp_number && (
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                {config.icp_number}
              </a>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-green-500" />
              {t('footer.slogan')}
            </span>
            <span>{t('footer.escrowNote')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
