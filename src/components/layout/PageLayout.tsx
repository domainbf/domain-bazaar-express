import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * 全站通用布局原语（Layout Primitives）
 * 所有页面统一复用，避免各页面自行微调造成割裂感。
 * 视觉规范见 docs/design-tokens.md
 */

/* ── 页面外壳 ─────────────────────────────────────────────── */
export const PageShell = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('min-h-screen bg-background text-foreground', className)} {...props}>
    {children}
  </div>
);

/* ── 内容容器（统一 max-w-6xl + 响应式内边距）─────────────── */
export const PageContainer = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('page-container', className)} {...props}>
    {children}
  </div>
);

/* ── Hero 容器（点阵纹理 + aurora 渐变）────────────────────── */
interface PageHeroProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  compact?: boolean;
  align?: 'center' | 'left';
}

export const PageHero = ({
  eyebrow,
  title,
  subtitle,
  actions,
  compact = false,
  align = 'center',
  className,
  children,
  ...props
}: PageHeroProps) => (
  <section className={cn('page-hero', compact ? 'py-8 md:py-10' : 'py-12 md:py-16', className)} {...props}>
    <div
      className="absolute inset-0 opacity-[0.05] pointer-events-none"
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)',
        backgroundSize: '24px 24px',
        maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 85%)',
      }}
    />
    <PageContainer className="relative z-10">
      <div className={align === 'center' ? 'text-center' : 'text-left'}>
        {eyebrow && <div className="page-eyebrow mb-4">{eyebrow}</div>}
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && (
          <p
            className={cn(
              'mt-3 text-sm md:text-lg text-muted-foreground',
              align === 'center' && 'mx-auto max-w-2xl',
            )}
          >
            {subtitle}
          </p>
        )}
        {actions && (
          <div className={cn('mt-6 flex flex-wrap gap-3', align === 'center' && 'justify-center')}>
            {actions}
          </div>
        )}
        {children}
      </div>
    </PageContainer>
  </section>
);

/* ── 区块（统一纵向节奏）──────────────────────────────────── */
interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  tone?: 'default' | 'muted' | 'card' | 'invert';
  bleed?: boolean; // 不包裹 PageContainer
}

const toneMap: Record<NonNullable<SectionProps['tone']>, string> = {
  default: 'bg-background',
  muted: 'bg-muted/40',
  card: 'bg-card',
  invert: 'invert-surface border-x-0 rounded-none',
};

export const Section = ({ tone = 'default', bleed, className, children, ...props }: SectionProps) => (
  <section className={cn('py-12 md:py-16', toneMap[tone], className)} {...props}>
    {bleed ? children : <PageContainer>{children}</PageContainer>}
  </section>
);

/* ── 区块标题 ─────────────────────────────────────────────── */
interface SectionHeadingProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
}

export const SectionHeading = ({
  eyebrow,
  title,
  subtitle,
  actions,
  align = 'left',
  className,
}: SectionHeadingProps) => (
  <div
    className={cn(
      'mb-8 flex flex-col gap-3',
      align === 'center' ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between',
      className,
    )}
  >
    <div className="space-y-2">
      {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

/* ── 卡片容器 ─────────────────────────────────────────────── */
interface ContentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: 'default' | 'glass' | 'invert';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

const paddingMap = { none: '', sm: 'p-4', md: 'p-5 md:p-6', lg: 'p-6 md:p-8' } as const;

export const ContentCard = ({
  tone = 'default',
  padding = 'md',
  interactive = false,
  className,
  children,
  ...props
}: ContentCardProps) => (
  <div
    className={cn(
      tone === 'glass' ? 'premium-surface' : tone === 'invert' ? 'invert-surface rounded-2xl' : 'simple-card',
      paddingMap[padding],
      interactive && 'hover-lift cursor-pointer',
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

/* ── 表格容器（统一圆角/边框/横向滚动）────────────────────── */
export const TableShell = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('rounded-xl border border-border bg-card shadow-card overflow-hidden', className)}
    {...props}
  >
    <div className="w-full overflow-x-auto">{children}</div>
  </div>
);

/* ── 弹窗内容容器（统一内边距与标题节奏）──────────────────── */
export const ModalShell = ({
  title,
  description,
  footer,
  className,
  children,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) => (
  <div className={cn('space-y-5', className)}>
    {(title || description) && (
      <div className="space-y-1.5">
        {title && <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    )}
    {children}
    {footer && <div className="flex flex-wrap justify-end gap-2 pt-2">{footer}</div>}
  </div>
);

/* ── 空状态 ───────────────────────────────────────────────── */
export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) => (
  <div className={cn('flex flex-col items-center justify-center gap-3 py-14 text-center', className)}>
    {icon && <div className="text-muted-foreground/60">{icon}</div>}
    <p className="text-base font-semibold text-foreground">{title}</p>
    {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
    {action}
  </div>
);
