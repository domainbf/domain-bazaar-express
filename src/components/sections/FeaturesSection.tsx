
import { Globe2, Sparkles, Crown, Diamond } from 'lucide-react';

export const FeaturesSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="glass-card p-8 rounded-2xl text-center transform hover:scale-105 transition-all duration-300">
            <Globe2 className="w-10 h-10 text-violet-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3 text-violet-200">全球可达</h3>
            <p className="text-gray-400">覆盖全球的域名交易网络，随时随地交易</p>
          </div>
          
          <div className="glass-card p-8 rounded-2xl text-center transform hover:scale-105 transition-all duration-300">
            <Sparkles className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3 text-cyan-200">优质精选</h3>
            <p className="text-gray-400">严选优质域名，确保投资价值</p>
          </div>
          
          <div className="glass-card p-8 rounded-2xl text-center transform hover:scale-105 transition-all duration-300">
            <Crown className="w-10 h-10 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3 text-amber-200">尊享服务</h3>
            <p className="text-gray-400">专业的域名顾问团队，全程贴心服务</p>
          </div>
          
          <div className="glass-card p-8 rounded-2xl text-center transform hover:scale-105 transition-all duration-300">
            <Diamond className="w-10 h-10 text-rose-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3 text-rose-200">增值保障</h3>
            <p className="text-gray-400">持续的价值评估，助力资产增值</p>
          </div>
        </div>
      </div>
    </section>
  );
};
