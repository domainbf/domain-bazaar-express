import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  HelpCircle, 
  MessageSquare, 
  Users, 
  Shield, 
  FileQuestion, 
  ArrowRight,
  Headphones
} from 'lucide-react';

const SupportSection = () => {
  const supportItems = [
    {
      icon: FileQuestion,
      title: '常见问题',
      description: '查看常见问题解答，快速找到您需要的信息',
      link: '/faq',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Users,
      title: '用户社区',
      description: '与其他用户交流经验，分享域名投资心得',
      link: '/community',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: Shield,
      title: '安全中心',
      description: '账户安全指引，保护您的域名资产安全',
      link: '/security-center',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: Headphones,
      title: '联系客服',
      description: '专业客服团队随时为您提供帮助和支持',
      link: '/contact',
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* 标题区域 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-4">
            <HelpCircle className="w-7 h-7 text-blue-600" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            需要帮助？
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            我们的客户服务团队随时为您提供支持，您也可以查看以下资源快速解决问题
          </p>
        </div>

        {/* 支持卡片网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {supportItems.map((item, index) => (
            <Link to={item.link} key={index}>
              <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-white">
                <CardContent className="p-5 md:p-6">
                  <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mb-4`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                  <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                    了解更多
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* 快速联系区域 */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <MessageSquare className="w-5 h-5" />
                <span className="font-semibold">在线客服支持</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2">
                遇到问题？联系我们的专业团队
              </h3>
              <p className="text-blue-100 text-sm md:text-base">
                工作时间：周一至周日 9:00 - 21:00，随时为您解答
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/contact">
                <Button 
                  className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-6 py-2.5"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  联系客服
                </Button>
              </Link>
              <Link to="/faq">
                <Button 
                  variant="outline"
                  className="border-2 border-white text-white bg-transparent hover:bg-white/10 font-bold px-6 py-2.5"
                >
                  <FileQuestion className="w-4 h-4 mr-2" />
                  常见问题
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SupportSection;
