
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
    <section className="relative pt-32 pb-20 px-4 overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 背景装饰 */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-1/4 animate-bounce">
          <Diamond className="w-8 h-8 text-violet-400/60" />
        </div>
        <div className="absolute top-40 right-1/3 animate-pulse">
          <Crown className="w-6 h-6 text-amber-400/60" />
        </div>
        <div className="absolute bottom-20 left-1/3 animate-bounce delay-300">
          <Star className="w-5 h-5 text-cyan-400/60" />
        </div>
        <div className="absolute top-60 right-1/4 animate-pulse delay-500">
          <Globe className="w-7 h-7 text-emerald-400/50" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto text-center relative z-10">
        {/* 主标题 */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">
          {t('homePage.title', '找到您理想的域名')}
        </h1>
        
        {/* 副标题 */}
        <p className="text-lg md:text-xl lg:text-2xl text-gray-200 max-w-3xl mx-auto mb-8 leading-relaxed">
          {t('homePage.subtitle', '探索、发现并获取适合您的下一个大创意的理想域名')}
        </p>

        {/* 搜索框 */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative flex">
            <Input
              type="text"
              placeholder="搜索您想要的域名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 h-14 text-lg px-6 bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-gray-300 focus:border-violet-400"
            />
            <Button 
              onClick={handleSearch}
              className="ml-3 h-14 px-8 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold"
            >
              <Search className="w-5 h-5 mr-2" />
              搜索
            </Button>
          </div>
        </div>
        
        {/* 特色卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 group">
            <GemIcon className="w-12 h-12 text-violet-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold mb-3 text-violet-200">{t('homePage.uniqueValue', '独特价值')}</h3>
            <p className="text-gray-300">{t('homePage.uniqueValueDescription', '每个域名都是独一无二的数字资产')}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 group">
            <ShieldCheck className="w-12 h-12 text-cyan-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold mb-3 text-cyan-200">{t('homePage.security', '安全保障')}</h3>
            <p className="text-gray-300">{t('homePage.securityDescription', '规范的交易流程，确保您的投资安全')}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 group">
            <Rocket className="w-12 h-12 text-amber-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold mb-3 text-amber-200">{t('homePage.potential', '增值潜力')}</h3>
            <p className="text-gray-300">{t('homePage.potentialDescription', '优质域名具备巨大的升值空间')}</p>
          </div>
        </div>

        {/* 统计数据 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-blue-400 mr-2" />
              <span className="text-3xl md:text-4xl font-bold text-white">10K+</span>
            </div>
            <p className="text-gray-300 text-sm md:text-base">活跃用户</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Globe className="w-6 h-6 text-green-400 mr-2" />
              <span className="text-3xl md:text-4xl font-bold text-white">5K+</span>
            </div>
            <p className="text-gray-300 text-sm md:text-base">域名交易</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-6 h-6 text-purple-400 mr-2" />
              <span className="text-3xl md:text-4xl font-bold text-white">98%</span>
            </div>
            <p className="text-gray-300 text-sm md:text-base">满意度</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <ShieldCheck className="w-6 h-6 text-cyan-400 mr-2" />
              <span className="text-3xl md:text-4xl font-bold text-white">24/7</span>
            </div>
            <p className="text-gray-300 text-sm md:text-base">安全保障</p>
          </div>
        </div>

        {/* 行动按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate('/marketplace')}
            className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-0"
          >
            浏览域名市场
          </Button>
          <Button 
            onClick={() => navigate('/auth')}
            variant="outline" 
            className="px-8 py-4 text-lg font-semibold border-2 border-white/30 text-white hover:bg-white/10 bg-transparent"
          >
            开始出售域名
          </Button>
        </div>
      </div>
    </section>
  );
};
