
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HeaderSectionProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const HeaderSection = ({ onRefresh, isRefreshing = false }: HeaderSectionProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">
        {t('admin.verifications.title', 'Pending Domain Verifications')}
      </h2>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
        {t('common.refresh', 'Refresh')}
      </Button>
    </div>
  );
};
