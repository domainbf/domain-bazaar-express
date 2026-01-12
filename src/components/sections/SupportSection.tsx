import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { 
  HelpCircle, 
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
      link: '/faq'
    },
    {
      icon: Users,
      title: '用户社区',
      description: '与其他用户交流经验，分享域名投资心得',
      link: '/community'
    },
    {
      icon: Shield,
      title: '安全中心',
      description: '账户安全指引，保护您的域名资产安全',
      link: '/security-center'
    },
    {
      icon: Headphones,
      title: '联系客服',
      description: '专业客服团队随时为您提供帮助和支持',
      link: '/contact'
    }
  ];

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* 标题区域 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-muted rounded-full mb-4">
            <HelpCircle className="w-7 h-7 text-foreground" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            需要帮助？
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            我们的客户服务团队随时为您提供支持，您也可以查看以下资源快速解决问题
          </p>
        </div>

        {/* 支持卡片网格 - 2x2布局 */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {supportItems.map((item, index) => (
            <Link to={item.link} key={index}>
              <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-border bg-card">
                <CardContent className="p-4 md:p-5">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                    <item.icon className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1.5 text-sm md:text-base">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-xs md:text-sm leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                  <div className="mt-3 flex items-center text-foreground text-xs md:text-sm font-medium">
                    了解更多
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SupportSection;
