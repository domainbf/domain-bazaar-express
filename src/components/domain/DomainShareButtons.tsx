
import React, { useState } from 'react';
import { Domain } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Share2, Facebook, Twitter, Linkedin, Mail, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DomainShareButtonsProps {
  domain: Domain;
}

export const DomainShareButtons: React.FC<DomainShareButtonsProps> = ({ domain }) => {
  const [isSharing, setIsSharing] = useState(false);
  
  const domainUrl = `${window.location.origin}/domain/${domain.id}`;
  const shareText = `查看这个优质域名：${domain.name} - ¥${domain.price.toLocaleString()}`;

  const logShare = async (platform: string) => {
    try {
      await supabase.from('domain_shares').insert({
        domain_id: domain.id,
        platform: platform,
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Failed to log share:', error);
    }
  };

  const handleShare = async (platform: string, url?: string) => {
    setIsSharing(true);
    
    try {
      if (platform === 'copy') {
        await navigator.clipboard.writeText(domainUrl);
        toast.success('链接已复制到剪贴板');
      } else if (url) {
        window.open(url, '_blank', 'width=600,height=400');
      }
      
      await logShare(platform);
    } catch (error) {
      console.error('Share error:', error);
      toast.error('分享失败，请重试');
    } finally {
      setIsSharing(false);
    }
  };

  const shareOptions = [
    {
      name: 'Facebook',
      icon: Facebook,
      platform: 'facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(domainUrl)}`
    },
    {
      name: 'Twitter',
      icon: Twitter,
      platform: 'twitter',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(domainUrl)}`
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      platform: 'linkedin',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(domainUrl)}`
    },
    {
      name: 'Email',
      icon: Mail,
      platform: 'email',
      url: `mailto:?subject=${encodeURIComponent(`推荐域名：${domain.name}`)}&body=${encodeURIComponent(`${shareText}\n\n${domainUrl}`)}`
    },
    {
      name: '复制链接',
      icon: Copy,
      platform: 'copy'
    }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isSharing}>
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {shareOptions.map((option) => (
          <DropdownMenuItem
            key={option.platform}
            onClick={() => handleShare(option.platform, option.url)}
            className="flex items-center gap-2"
          >
            <option.icon className="h-4 w-4" />
            {option.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
