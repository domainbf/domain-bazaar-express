
import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Facebook, Twitter, Linkedin, Mail, Copy } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DomainShareButtonsProps {
  domainName: string;
}

export const DomainShareButtons: React.FC<DomainShareButtonsProps> = ({ domainName }) => {
  const shareText = `查看这个域名：${domainName}`;

  const handleShare = async (platform: string) => {
    // Always compute the exact current-route absolute URL and force og:url /
    // twitter:url / canonical to match before we hand it to a scraper.
    const { prepareShareUrl, verifyHeadUrls } = await import('@/lib/canonicalUrl');
    const currentUrl = prepareShareUrl();
    const check = verifyHeadUrls(currentUrl);
    if (!check.ok) {
      console.warn('[share] head tags mismatch after sync:', check.mismatches);
    }

    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(`域名推荐：${domainName}`)}&body=${encodeURIComponent(`${shareText}\n${currentUrl}`)}`;
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(currentUrl);
          toast.success('链接已复制到剪贴板');
        } catch {
          toast.error('复制失败，请手动复制');
        }
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleShare('facebook')}>
          <Facebook className="h-4 w-4 mr-2" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('twitter')}>
          <Twitter className="h-4 w-4 mr-2" />
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('linkedin')}>
          <Linkedin className="h-4 w-4 mr-2" />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('email')}>
          <Mail className="h-4 w-4 mr-2" />
          邮件
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('copy')}>
          <Copy className="h-4 w-4 mr-2" />
          复制链接
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
