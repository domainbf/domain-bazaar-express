import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bookmark } from 'lucide-react';
import { SavedSearches } from '@/components/marketplace/SavedSearches';

export const SavedSearchesPanel = () => {
  const navigate = useNavigate();

  const handleApply = (query: string, filters: Record<string, any>) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'all') params.set(k, String(v));
    });
    navigate(`/marketplace${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bookmark className="h-4 w-4" />我的搜索订阅
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          保存常用的搜索条件，点击即可回到市场页继续浏览；开启提醒后有新域名匹配时会通知你。
        </p>
      </CardHeader>
      <CardContent>
        <SavedSearches currentQuery="" currentFilters={{}} onApply={handleApply} />
      </CardContent>
    </Card>
  );
};

export default SavedSearchesPanel;
