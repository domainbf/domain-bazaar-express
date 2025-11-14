
import { Diamond, Crown, Star, GemIcon, ShieldCheck, Rocket, Search, TrendingUp, Users, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const HeroSection = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/marketplace');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className="relative pt-12 md:pt-20 pb-10 md:pb-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto text-center">
        {/* 主标题 */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-gray-900 leading-tight">
          {t('homePage.title', '找到您理想的域名')}
        </h1>
        
        {/* 副标题 */}
        <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-6 md:mb-8 px-2">
          {t('homePage.subtitle', '探索、发现并获取适合您的下一个大创意的理想域名')}
        </p>

        {/* 搜索框 */}
        <div className="max-w-2xl mx-auto mb-8 md:mb-12">
          <div className="relative flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              placeholder="搜索您想要的域名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 h-11 md:h-12 text-base md:text-lg px-4 md:px-6 border-gray-300"
            />
            <Button 
              onClick={handleSearch}
              className="h-11 md:h-12 px-6 md:px-8 bg-gray-900 hover:bg-gray-800 text-white whitespace-nowrap"
            >
              <Search className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              搜索
            </Button>
          </div>
        </div>

        {/* 行动按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-2">
          <Button 
            onClick={() => navigate('/marketplace')}
            className="px-6 md:px-8 py-2.5 md:py-3 text-base md:text-lg bg-gray-900 hover:bg-gray-800 text-white"
          >
            浏览域名市场
          </Button>
          <Button 
            onClick={() => navigate('/auth')}
            variant="outline" 
            className="px-6 md:px-8 py-2.5 md:py-3 text-base md:text-lg border-gray-300 text-gray-900 hover:bg-gray-50"
          >
            开始出售域名
          </Button>
        </div>
      </div>
    </section>
  );
};
