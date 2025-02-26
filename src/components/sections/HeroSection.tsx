
import { Diamond, Crown, Star, GemIcon, ShieldCheck, Rocket } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-1/4 animate-float">
          <Diamond className="w-8 h-8 text-violet-400/60" />
        </div>
        <div className="absolute top-40 right-1/3 animate-float delay-300">
          <Crown className="w-6 h-6 text-amber-400/60" />
        </div>
        <div className="absolute bottom-20 left-1/3 animate-float delay-500">
          <Star className="w-5 h-5 text-cyan-400/60" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 animate-glow">
          {t('title')}
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-12 leading-relaxed">
          {t('subtitle')}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="glass-card p-6 rounded-xl backdrop-blur-md border border-white/10">
            <GemIcon className="w-10 h-10 text-violet-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-violet-200">独特价值</h3>
            <p className="text-gray-400">每个域名都是独一无二的数字资产</p>
          </div>
          <div className="glass-card p-6 rounded-xl backdrop-blur-md border border-white/10">
            <ShieldCheck className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-cyan-200">安全保障</h3>
            <p className="text-gray-400">规范的交易流程，确保您的投资安全</p>
          </div>
          <div className="glass-card p-6 rounded-xl backdrop-blur-md border border-white/10">
            <Rocket className="w-10 h-10 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-amber-200">增值潜力</h3>
            <p className="text-gray-400">优质域名具备巨大的升值空间</p>
          </div>
        </div>
      </div>
    </section>
  );
};
