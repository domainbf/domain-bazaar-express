
import React from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface LoadingIndicatorProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  text = "加载中...", 
  size = "md" 
}) => {
  return (
    <div className="flex justify-center items-center py-8">
      <LoadingSpinner size={size} text={text} />
    </div>
  );
};
