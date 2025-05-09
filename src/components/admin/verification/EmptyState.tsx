
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const EmptyState = ({ onRefresh, isRefreshing = false }: EmptyStateProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <p className="text-gray-600 mb-4">
        {t('admin.verifications.noPending', 'No pending verifications')}
      </p>
      <Button 
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
