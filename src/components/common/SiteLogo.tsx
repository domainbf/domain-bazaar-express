import { cn } from '@/lib/utils';

interface SiteLogoProps {
  src: string;
  alt: string;
  /** tailwind height class, e.g. "h-10" */
  className?: string;
  /** hide the image (and reveal fallback sibling) on load error */
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

/**
 * 站点 Logo：自适应缩放（保持比例、不裁切），并通过混合模式消除上传图片自带的纯白/纯黑底色，
 * 使其在浅色与深色主题下都能自然融入页面。
 */
export const SiteLogo = ({ src, alt, className, onError }: SiteLogoProps) => (
  <img
    src={src}
    alt={alt}
    loading="eager"
    decoding="async"
    className={cn(
      'w-auto max-w-[180px] object-contain select-none',
      'mix-blend-multiply dark:mix-blend-screen dark:invert-0',
      className,
    )}
    onError={onError}
  />
);

export default SiteLogo;
