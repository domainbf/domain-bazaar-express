import { cn } from '@/lib/utils';

interface DomainWordmarkProps {
  name: string;
  className?: string;
}

function getWordmarkSize(totalLength: number) {
  if (totalLength <= 7) return 'text-lg';
  if (totalLength <= 10) return 'text-base';
  if (totalLength <= 14) return 'text-sm';
  return 'text-xs';
}

export function DomainWordmark({ name, className }: DomainWordmarkProps) {
  const [rawBase, ...rest] = name.trim().split('.');
  const base = (rawBase || name).toUpperCase();
  const ext = rest.length ? `.${rest.join('.').toUpperCase()}` : '';
  const sizeClass = getWordmarkSize(`${base}${ext}`.length);

  return (
    <div className={cn('flex min-w-0 max-w-full items-baseline justify-center gap-1 px-2 text-center', className)}>
      <span className={cn('truncate font-black leading-none tracking-tight text-foreground', sizeClass)}>
        {base}
      </span>
      {ext ? (
        <span className={cn('shrink-0 font-black leading-none tracking-tight text-foreground/70', sizeClass)}>
          {ext}
        </span>
      ) : null}
    </div>
  );
}