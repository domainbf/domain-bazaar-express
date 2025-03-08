
import { useState } from 'react';
import { DomainCard } from '@/components/DomainCard';
import { availableDomains } from '@/data/availableDomains';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDomains = availableDomains
    .filter(domain => filter === 'all' || domain.category === filter)
    .filter(domain => 
      searchQuery ? domain.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
    );

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <header className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-black mb-6">
            找到您的理想域名
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            精选稀有短域名，等待您的报价
          </p>
          
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Input
                type="text"
                placeholder="搜索域名..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-white border-gray-300 focus:border-black"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>
        </div>
      </header>

      {/* Filter Section */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-black text-white' : 'text-gray-700 border-gray-300'}
            >
              全部
            </Button>
            <Button
              variant={filter === 'premium' ? 'default' : 'outline'}
              onClick={() => setFilter('premium')}
              className={filter === 'premium' ? 'bg-black text-white' : 'text-gray-700 border-gray-300'}
            >
              优质域名
            </Button>
            <Button
              variant={filter === 'short' ? 'default' : 'outline'}
              onClick={() => setFilter('short')}
              className={filter === 'short' ? 'bg-black text-white' : 'text-gray-700 border-gray-300'}
            >
              短域名
            </Button>
            <Button
              variant={filter === 'dev' ? 'default' : 'outline'}
              onClick={() => setFilter('dev')}
              className={filter === 'dev' ? 'bg-black text-white' : 'text-gray-700 border-gray-300'}
            >
              开发者域名
            </Button>
          </div>

          {/* Domain Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {filteredDomains.map((domain) => (
              <DomainCard 
                key={domain.name} 
                domain={domain.name} 
                price={domain.price}
                highlight={domain.highlight}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-black mb-12">平台数据</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-black mb-2">50,000+</div>
              <div className="text-gray-600">活跃用户</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-black mb-2">100+</div>
              <div className="text-gray-600">支持国家/地区</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-black mb-2">¥100M+</div>
              <div className="text-gray-600">交易总额</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-black mb-2">24/7</div>
              <div className="text-gray-600">全天候服务</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-black mb-12">我们的优势</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="simple-card p-6 text-center">
              <h3 className="text-xl font-semibold mb-3 text-black">全球可达</h3>
              <p className="text-gray-600">覆盖全球的域名交易网络，随时随地交易</p>
            </div>
            
            <div className="simple-card p-6 text-center">
              <h3 className="text-xl font-semibold mb-3 text-black">优质精选</h3>
              <p className="text-gray-600">严选优质域名，确保投资价值</p>
            </div>
            
            <div className="simple-card p-6 text-center">
              <h3 className="text-xl font-semibold mb-3 text-black">尊享服务</h3>
              <p className="text-gray-600">专业的域名顾问团队，全程贴心服务</p>
            </div>
            
            <div className="simple-card p-6 text-center">
              <h3 className="text-xl font-semibold mb-3 text-black">增值保障</h3>
              <p className="text-gray-600">持续的价值评估，助力资产增值</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-black mb-6">联系我们</h2>
              <p className="text-gray-600 mb-8">
                无论您有任何问题或建议，我们都随时准备为您提供专业的咨询服务
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="text-black font-medium">电话咨询</div>
                    <div className="text-gray-600">400-123-4567</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="text-black font-medium">邮件支持</div>
                    <div className="text-gray-600">support@example.com</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="text-black font-medium">在线客服</div>
                    <div className="text-gray-600">7x24小时在线服务</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="simple-card p-8">
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    您的姓名
                  </label>
                  <Input 
                    type="text" 
                    placeholder="请输入您的姓名"
                    className="w-full bg-white border-gray-300 focus:border-black"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    联系邮箱
                  </label>
                  <Input 
                    type="email" 
                    placeholder="请输入您的邮箱"
                    className="w-full bg-white border-gray-300 focus:border-black"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    咨询内容
                  </label>
                  <textarea 
                    rows={4}
                    placeholder="请详细描述您的需求"
                    className="w-full bg-white border border-gray-300 focus:border-black rounded-md p-3 text-black"
                  />
                </div>
                
                <Button 
                  type="submit"
                  className="w-full bg-black text-white hover:bg-gray-800"
                >
                  提交咨询
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>© 2024 域名交易平台. 保留所有权利.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
