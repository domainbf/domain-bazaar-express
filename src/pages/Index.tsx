import { useState } from 'react';
import { DomainCard } from '@/components/DomainCard';

const availableDomains = [
  "nic.bn", "X.RW", "F.AF", "L.KE", "Y.CR", "CXL.NET", "Top.vg", "Dev.ug",
  "BUG.KZ", "Fil.ng", "DOMAIN.BF", "WHOIS.LS", "GAME.kg", "Rule.ml",
  "SORA.mk", "Name.cf", "Fuck.bf", "Fuck.fo", "1024.pw", "0451.me",
  "0451.xyz", "Hello.uy", "Met.as", "Tools.st", "intels.at",
  "HUANGPIAN.NET", "KUAIGAN.NET", "liaoliao.me"
];

const soldDomains = [
  "sold.com",
  "example.net",
  "demo.org"
];

const Index = () => {
  const [filter, setFilter] = useState('all'); // 'all', 'available', 'sold'

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 neon-text bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-cyan-500">
            优质域名展示
          </h1>
          <p className="text-xl text-gray-400">
            精选稀有短域名，等待您的报价
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-full transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-6 py-2 rounded-full transition-all ${
              filter === 'available'
                ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            可售
          </button>
          <button
            onClick={() => setFilter('sold')}
            className={`px-6 py-2 rounded-full transition-all ${
              filter === 'sold'
                ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            已售
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(filter === 'all' || filter === 'available') &&
            availableDomains.map((domain) => (
              <DomainCard key={domain} domain={domain} />
            ))}
          
          {(filter === 'all' || filter === 'sold') &&
            soldDomains.map((domain) => (
              <DomainCard key={domain} domain={domain} isSold={true} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default Index;