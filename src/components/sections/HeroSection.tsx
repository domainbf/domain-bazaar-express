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
    <section className="relative pt-12 md:pt-20 pb-12 md:pb-20 px-4 bg-gradient-to-b from-white via-blue-50 to-white">
      <div className="max-w-6xl mx-auto">
        {/* 主标题 */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 text-gray-900 leading-tight">
            {t('homePage.title', '找到您理想的域名')}
          </h1>

          {/* 副标题 */}
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-4 px-2">
            {t('homePage.subtitle', '探索、发现并获取适合您的下一个大创意的理想域名')}
          </p>
        </div>

        {/* 搜索框 - 中心居中 */}
        <div className="max-w-3xl mx-auto mb-10 md:mb-16">
          <div className="bg-white rounded-2xl shadow-lg p-1 border border-gray-100">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="text"
                placeholder="搜索您想要的域名..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 h-12 md:h-14 text-base md:text-lg px-4 md:px-6 border-0 focus-visible:ring-0"
              />
              <Button
                onClick={handleSearch}
                className="h-12 md:h-14 px-6 md:px-10 bg-gray-900 hover:bg-gray-800 text-white whitespace-nowrap rounded-xl font-semibold text-base md:text-lg"
              >
                <Search className="w-5 h-5 mr-2" />
                搜索
              </Button>
            </div>
          </div>

          {/* 快速标签 */}
          <div className="flex flex-wrap gap-2 justify-center mt-4 px-2">
            <span className="text-xs text-gray-500">热搜：</span>
            <button onClick={() => setSearchQuery('ai')} className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors">
              AI
            </button>
            <button onClick={() => setSearchQuery('tech')} className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors">
              Tech
            </button>
            <button onClick={() => setSearchQuery('shop')} className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors">
              Shop
            </button>
          </div>
        </div>

        {/* 行动按钮 - 改进设计 */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-2 items-center">
          <Button
            onClick={() => navigate('/marketplace')}
            className="px-8 md:px-10 py-3 md:py-4 text-base md:text-lg bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            浏览域名市场
          </Button>

          <div className="hidden sm:block text-gray-300">|</div>

          <Button
            onClick={() => navigate('/auth')}
            variant="outline"
            className="px-8 md:px-10 py-3 md:py-4 text-base md:text-lg border-2 border-gray-300 text-gray-900 hover:bg-gray-50 font-semibold rounded-xl transition-all duration-200"
          >
            <Rocket className="w-5 h-5 mr-2" />
            开始出售域名
          </Button>
        </div>

        {/* 信任指标 */}
        <div className="mt-12 md:mt-16 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">10K+</p>
              <p className="text-sm text-gray-600 mt-1">优质域名</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">50K+</p>
              <p className="text-sm text-gray-600 mt-1">注册用户</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">99%</p>
              <p className="text-sm text-gray-600 mt-1">用户满意度</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">24/7</p>
              <p className="text-sm text-gray-600 mt-1">客户支持</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
