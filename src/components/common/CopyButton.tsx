
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Copy, Check } from 'lucide-react';
import { toast } from "sonner";

export interface CopyButtonProps {
  value?: string;
  className?: string;
  children?: React.ReactNode;
}

export const CopyButton = ({ value, className, children }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("已复制到剪贴板");
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error("复制失败");
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
