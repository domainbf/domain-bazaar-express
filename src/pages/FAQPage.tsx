import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  MessageCircle, 
  Phone,
  Mail,
  Clock,
  Globe,
  Shield,
  CreditCard,
  Users
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: '什么是NIC.BN域名交易平台？',
    answer: 'NIC.BN是文莱国家顶级域名(.bn)的官方交易平台，为用户提供安全、便捷的域名买卖服务。',
    category: 'general',
    tags: ['平台介绍', '域名交易']
  },
  {
    id: '2',
    question: '如何在平台上出售我的域名？',
    answer: '1. 注册并登录账户 2. 在"我的域名"中添加要出售的域名 3. 完成域名验证 4. 设置价格和描述 5. 发布到市场。',
    category: 'general',
    tags: ['出售域名', '域名验证']
  },
  {
    id: '3',
    question: '如何购买域名？',
    answer: '浏览市场找到心仪的域名，点击"立即报价"或"立即购买"。报价需要等待卖家回复，直接购买则可立即完成交易。',
    category: 'transaction',
    tags: ['购买域名', '报价']
  },
  {
    id: '4',
    question: '平台收取什么费用？',
    answer: '平台对买家免费，对卖家收取成交金额的5%作为服务费。费用仅在交易成功后收取。',
    category: 'general',
    tags: ['费用', '手续费']
  }
];

export const FAQPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const filteredFAQs = faqData.filter(faq => 
    searchQuery === '' || 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">常见问题</h1>
          <p className="text-xl text-gray-600">找到您需要的答案，或联系我们获取帮助</p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="搜索问题、关键词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 text-lg"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredFAQs.map(faq => (
            <Card key={faq.id} className="transition-all hover:shadow-md">
              <CardContent className="p-0">
                <button
                  className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpanded(faq.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                      <div className="flex flex-wrap gap-2">
                        {faq.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="ml-4">
                      {expandedItems.has(faq.id) ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </button>
                
                {expandedItems.has(faq.id) && (
                  <div className="px-6 pb-6 border-t bg-gray-50">
                    <p className="text-gray-700 leading-relaxed pt-4">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">没有找到您的问题？</p>
          <Link to="/contact">
            <Button>联系客服</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;