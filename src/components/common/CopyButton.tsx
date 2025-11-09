
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Copy, Check } from 'lucide-react';
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';

export interface CopyButtonProps {
  value?: string;
  className?: string;
  children?: React.ReactNode;
  text?: string; // 添加一个 text 属性，兼容现有代码
}

export const CopyButton = ({ value, className, children, text }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);
  const contentToCopy = value || text || '';
  const { t } = useTranslation();

  const handleCopy = async () => {
    if (!contentToCopy) return;
    
    try {
      await navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      toast.success(t('common.copySuccess'));
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error(t('common.copyFailed'));
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={handleCopy}
      type="button"
    >
      {children}
      {copied ? (
        <Check className="h-4 w-4 ml-2" />
      ) : (
        <Copy className="h-4 w-4 ml-2" />
      )}
    </Button>
  );
};
