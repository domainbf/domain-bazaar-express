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
    answer: 'NIC.BN是文莱国家顶级域名(.bn)的官方交易平台，为用户提供安全、便捷的域名买卖服务。我们致力于打造透明、高效的域名交易生态系统。',
    category: 'general',
    tags: ['平台介绍', '域名交易']
  },
  {
    id: '2',
    question: '如何在平台上出售我的域名？',
    answer: '出售域名的步骤：1. 注册并登录账户 2. 进入"用户中心"→"我的域名" 3. 点击"添加域名"并填写域名信息 4. 完成域名所有权验证（支持DNS、HTML文件、邮箱验证三种方式） 5. 设置销售价格和域名描述 6. 发布到市场。验证通过后，您的域名将在市场中展示。',
    category: 'general',
    tags: ['出售域名', '域名验证', '发布域名']
  },
  {
    id: '3',
    question: '如何购买域名？',
    answer: '购买域名非常简单：1. 在市场页面浏览或搜索您想要的域名 2. 点击域名查看详情 3. 选择"立即报价"向卖家提出您的价格，或"立即购买"按标价购买 4. 填写联系信息并提交 5. 等待卖家回复（报价）或完成交易（直接购买）。建议使用平台提供的担保交易服务确保安全。',
    category: 'transaction',
    tags: ['购买域名', '报价', '交易流程']
  },
  {
    id: '4',
    question: '平台收取什么费用？',
    answer: '平台费用结构：买家无需支付任何费用。卖家成交后需支付5%的服务费，该费用从成交金额中自动扣除。例如域名售价$1000，卖家实际收到$950。费用仅在交易成功后收取，挂售域名不收费。',
    category: 'general',
    tags: ['费用', '手续费', '服务费']
  },
  {
    id: '5',
    question: '域名验证需要多长时间？',
    answer: '域名验证时间取决于验证方式：DNS验证通常需要1-24小时（取决于DNS传播速度），HTML文件验证和邮箱验证通常在几分钟内完成。如果验证失败，请检查配置是否正确或联系客服寻求帮助。',
    category: 'verification',
    tags: ['域名验证', '验证时间']
  },
  {
    id: '6',
    question: '如何确保交易安全？',
    answer: '我们提供多重安全保障：1. 实名认证和域名所有权验证 2. 平台担保交易服务 3. 交易资金托管 4. 专业客服团队处理纠纷 5. 完整的交易记录和证据保存。建议始终通过平台进行交易，不要线下私下交易。',
    category: 'transaction',
    tags: ['交易安全', '担保交易']
  },
  {
    id: '7',
    question: '可以取消或修改已发布的域名吗？',
    answer: '可以。在用户中心的"我的域名"页面，您可以随时编辑域名信息（价格、描述等）、下架域名或重新上架。如果域名已有待处理的报价或正在交易中，需要先处理完这些事项才能修改。',
    category: 'general',
    tags: ['域名管理', '修改信息']
  },
  {
    id: '8',
    question: '报价被拒绝后还能再次报价吗？',
    answer: '可以。如果您的报价被卖家拒绝，您可以提交新的报价。建议在再次报价前与卖家沟通，了解其期望价格范围，提高成交机会。',
    category: 'transaction',
    tags: ['报价', '议价']
  },
  {
    id: '9',
    question: '域名转移需要多长时间？',
    answer: '域名转移时间因注册商而异，通常需要5-7个工作日。转移过程中，卖家需要提供转移授权码，买家需要在其注册商处确认转移。平台会协助双方完成整个转移流程。',
    category: 'transaction',
    tags: ['域名转移', '交易流程']
  },
  {
    id: '10',
    question: '忘记密码怎么办？',
    answer: '点击登录页面的"忘记密码"链接，输入您的注册邮箱，系统会发送密码重置链接到您的邮箱。如果没有收到邮件，请检查垃圾邮件文件夹，或联系客服协助找回。',
    category: 'account',
    tags: ['账户安全', '密码重置']
  },
  {
    id: '11',
    question: '如何提升域名的曝光率？',
    answer: '提升域名曝光的方法：1. 设置合理的价格 2. 撰写详细的域名描述，突出优势 3. 使用准确的分类标签 4. 保持账户活跃度 5. 考虑参与平台的推广活动。优质域名会获得更多展示机会。',
    category: 'general',
    tags: ['域名营销', '提升曝光']
  },
  {
    id: '12',
    question: '平台支持哪些支付方式？',
    answer: '目前平台支持多种支付方式，包括银行转账、在线支付等。具体支付方式会在交易确认时显示。我们正在不断扩展支付选项以提供更便捷的服务。',
    category: 'transaction',
    tags: ['支付方式', '付款']
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