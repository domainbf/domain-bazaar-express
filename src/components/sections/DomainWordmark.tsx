import { cn } from '@/lib/utils';

interface DomainWordmarkProps {
  name: string;
  className?: string;
}

function getWordmarkSize(totalLength: number) {
  if (totalLength <= 6) return 'text-base';
  if (totalLength <= 9) return 'text-sm';
  if (totalLength <= 13) return 'text-xs';
  return 'text-[10px]';
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
