import { cn } from '@/lib/utils';

interface DomainWordmarkProps {
  name: string;
  className?: string;
}

// 更激进的缩放，确保完整域名可见而不被截断
function getWordmarkSize(totalLength: number) {
  if (totalLength <= 5) return 'text-lg';
  if (totalLength <= 7) return 'text-base';
  if (totalLength <= 9) return 'text-sm';
  if (totalLength <= 11) return 'text-xs';
  if (totalLength <= 14) return 'text-[10px]';
  if (totalLength <= 18) return 'text-[9px]';
  return 'text-[8px]';
}

export function DomainWordmark({ name, className }: DomainWordmarkProps) {
  const [rawBase, ...rest] = name.trim().split('.');
  const base = (rawBase || name).toUpperCase();
  const ext = rest.length ? `.${rest.join('.').toUpperCase()}` : '';
  const sizeClass = getWordmarkSize(`${base}${ext}`.length);

  return (
    <div
      className={cn('flex min-w-0 max-w-full items-baseline justify-center gap-0.5 px-1 text-center', className)}
      title={name}
    >
      <span className={cn('font-black leading-none tracking-tight text-foreground whitespace-nowrap', sizeClass)}>
        {base}
      </span>
      {ext ? (
        <span className={cn('shrink-0 font-black leading-none tracking-tight text-foreground/70 whitespace-nowrap', sizeClass)}>
          {ext}
        </span>
      ) : null}
    </div>
  );
}
