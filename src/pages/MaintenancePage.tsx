import { useEffect, useState } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Wrench, Globe, Clock, Zap, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DOMAINS = ['premium.cn', 'brand.com', 'startup.io', 'future.ai', 'shop.cn', 'invest.hk'];

function FloatingDomain({ text, style }: { text: string; style: React.CSSProperties }) {
  return (
    <span
      className="absolute px-2 py-0.5 rounded text-xs font-mono font-medium border select-none pointer-events-none"
      style={{
        ...style,
        color: 'hsl(var(--muted-foreground) / 0.35)',
        borderColor: 'hsl(var(--border) / 0.4)',
        background: 'hsl(var(--muted) / 0.2)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {text}
    </span>
  );
}

function GearIcon({ size = 64, className = '', speed = '8s' }: { size?: number; className?: string; speed?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      style={{ animation: `spin ${speed} linear infinite` }}
    >
      <path
        d="M32 20a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm0 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12z"
        fill="currentColor"
        opacity="0.8"
      />
      <path
        d="M54.3 28.6l-3.2-.7a20 20 0 0 0-1.3-3.2l1.8-2.8a2 2 0 0 0-.3-2.5l-3.7-3.7a2 2 0 0 0-2.5-.3l-2.8 1.8a20 20 0 0 0-3.2-1.3l-.7-3.2A2 2 0 0 0 36.4 11h-8.8a2 2 0 0 0-2 1.7l-.7 3.2a20 20 0 0 0-3.2 1.3l-2.8-1.8a2 2 0 0 0-2.5.3l-3.7 3.7a2 2 0 0 0-.3 2.5l1.8 2.8a20 20 0 0 0-1.3 3.2l-3.2.7A2 2 0 0 0 8 30.6v5.2a2 2 0 0 0 1.7 2l3.2.7a20 20 0 0 0 1.3 3.2l-1.8 2.8a2 2 0 0 0 .3 2.5l3.7 3.7a2 2 0 0 0 2.5.3l2.8-1.8a20 20 0 0 0 3.2 1.3l.7 3.2A2 2 0 0 0 27.6 55h8.8a2 2 0 0 0 2-1.7l.7-3.2a20 20 0 0 0 3.2-1.3l2.8 1.8a2 2 0 0 0 2.5-.3l3.7-3.7a2 2 0 0 0 .3-2.5l-1.8-2.8a20 20 0 0 0 1.3-3.2l3.2-.7A2 2 0 0 0 56 35.4v-5.2a2 2 0 0 0-1.7-1.6z"
        fill="currentColor"
        opacity="0.3"
      />
    </svg>
  );
}

export default function MaintenancePage() {
  const { config } = useSiteSettings();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const title = (config as any).maintenance_title || '系统维护中';
  const message = (config as any).maintenance_message || '我们正在对平台进行升级维护，即将回来，感谢您的耐心等待。';
  const contactEmail = config.contact_email;

  const floats = [
    { text: DOMAINS[0], style: { top: '12%', left: '6%', animationDelay: '0s' } },
    { text: DOMAINS[1], style: { top: '22%', right: '8%', animationDelay: '1.2s' } },
    { text: DOMAINS[2], style: { bottom: '28%', left: '4%', animationDelay: '0.6s' } },
    { text: DOMAINS[3], style: { top: '55%', right: '5%', animationDelay: '1.8s' } },
    { text: DOMAINS[4], style: { bottom: '14%', right: '12%', animationDelay: '0.3s' } },
    { text: DOMAINS[5], style: { top: '38%', left: '3%', animationDelay: '2.1s' } },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden select-none">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes spin-rev { to { transform: rotate(-360deg); } }
        @keyframes float-up {
          0%, 100% { transform: translateY(0px) rotate(-1deg); opacity: 0.35; }
          50% { transform: translateY(-12px) rotate(1deg); opacity: 0.55; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 hsl(var(--primary) / 0.3); }
          70% { transform: scale(1); box-shadow: 0 0 0 18px hsl(var(--primary) / 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 hsl(var(--primary) / 0); }
        }
        .float-domain { animation: float-up 4s ease-in-out infinite; }
        .pulse-ring { animation: pulse-ring 2.4s ease-out infinite; }
      `}</style>

      {/* Radial glow background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 50% 40%, hsl(var(--primary) / 0.07) 0%, transparent 70%)',
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Floating domain labels */}
      {floats.map((f, i) => (
        <FloatingDomain
          key={i}
          text={f.text}
          style={{ ...f.style, animationDelay: f.style.animationDelay } as React.CSSProperties}
        />
      ))}

      {/* Main card */}
      <div className="relative z-10 flex flex-col items-center px-6 max-w-lg w-full text-center">

        {/* Gear cluster */}
        <div className="relative mb-8 w-28 h-28 flex items-center justify-center">
          <div className="pulse-ring w-20 h-20 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-primary">
              <GearIcon size={56} speed="10s" />
            </div>
          </div>
          <div
            className="absolute -top-1 -right-1 text-muted-foreground/60"
            style={{ animation: 'spin-rev 6s linear infinite' }}
          >
            <GearIcon size={26} speed="6s" className="text-muted-foreground/60" />
          </div>
          <div
            className="absolute -bottom-1 -left-2 text-muted-foreground/40"
            style={{ animation: 'spin 14s linear infinite' }}
          >
            <GearIcon size={20} speed="14s" className="text-muted-foreground/40" />
          </div>
        </div>

        {/* Site name / logo */}
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-muted-foreground tracking-wide">
            {config.site_name || '域见•你'}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
          {title}
        </h1>

        {/* Message */}
        <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-sm">
          {message}
        </p>

        {/* Status row */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 border border-border/50 rounded-full px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <Wrench className="h-3 w-3" />
            <span>维护进行中</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 border border-border/50 rounded-full px-3 py-1.5">
            <Clock className="h-3 w-3" />
            <span>预计即将恢复</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 border border-border/50 rounded-full px-3 py-1.5">
            <Zap className="h-3 w-3 text-primary" />
            <span>数据全程安全</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
            刷新页面
          </Button>
          {contactEmail && (
            <Button
              variant="default"
              className="flex-1 gap-2"
              onClick={() => window.open(`mailto:${contactEmail}`, '_blank')}
            >
              联系我们
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Footer */}
        <p className="mt-10 text-xs text-muted-foreground/50">
          {config.footer_text || `© ${new Date().getFullYear()} ${config.site_name || '域见•你'} · 保留所有权利`}
        </p>
      </div>
    </div>
  );
}
