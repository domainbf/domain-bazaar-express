import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Consistent, minimal empty-state used across marketplace, portfolio, offers,
 * messages, and admin lists. Includes a subtle animated icon halo.
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  className,
  size = 'md',
}: EmptyStateProps) => {
  const pad = size === 'sm' ? 'py-8' : size === 'lg' ? 'py-20' : 'py-14';
  const iconSize = size === 'sm' ? 'h-9 w-9' : size === 'lg' ? 'h-14 w-14' : 'h-11 w-11';

  return (
    <div
      className={cn('flex flex-col items-center justify-center text-center px-6', pad, className)}
      data-testid="empty-state"
    >
      {Icon && (
        <div className="relative mb-4">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-pulse"
          />
          <div className={cn(
            'relative inline-flex items-center justify-center rounded-full bg-muted/60 text-muted-foreground',
            'ring-1 ring-border/50',
            size === 'sm' ? 'h-14 w-14' : size === 'lg' ? 'h-20 w-20' : 'h-16 w-16',
          )}>
            <Icon className={iconSize} strokeWidth={1.5} />
          </div>
        </div>
      )}
      <h3 className={cn('font-semibold', size === 'sm' ? 'text-sm' : 'text-base')}>{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {(actionLabel || secondaryLabel) && (
        <div className="mt-5 flex flex-wrap gap-2 justify-center">
          {actionLabel && onAction && (
            <Button onClick={onAction} size={size === 'sm' ? 'sm' : 'default'}>
              {actionLabel}
            </Button>
          )}
          {secondaryLabel && onSecondary && (
            <Button onClick={onSecondary} variant="outline" size={size === 'sm' ? 'sm' : 'default'}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
