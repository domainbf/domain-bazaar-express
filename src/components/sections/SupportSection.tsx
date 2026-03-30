import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import {
  HelpCircle,
  Users,
  Shield,
  FileQuestion,
  ArrowRight,
  Headphones,
} from 'lucide-react';
import { motion } from 'framer-motion';

const supportItems = [
  {
    icon: FileQuestion,
    title: '常见问题',
    description: '查看常见问题解答，快速找到您需要的信息',
    link: '/faq',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    ring: 'ring-blue-200 dark:ring-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    arrowColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: Users,
    title: '用户社区',
    description: '与其他用户交流经验，分享域名投资心得',
    link: '/community',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    ring: 'ring-violet-200 dark:ring-violet-800',
    iconColor: 'text-violet-600 dark:text-violet-400',
    arrowColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    icon: Shield,
    title: '安全中心',
    description: '账户安全指引，保护您的域名资产安全',
    link: '/security-center',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    ring: 'ring-emerald-200 dark:ring-emerald-800',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    arrowColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Headphones,
    title: '联系客服',
    description: '专业客服团队随时为您提供帮助和支持',
    link: '/contact',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    ring: 'ring-amber-200 dark:ring-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
    arrowColor: 'text-amber-600 dark:text-amber-400',
  },
];

const SupportSection = () => {
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 ring-1 ring-indigo-200 dark:ring-indigo-800 rounded-2xl mb-4">
            <HelpCircle className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">需要帮助？</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            我们的客户服务团队随时为您提供支持，您也可以查看以下资源快速解决问题
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {supportItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              viewport={{ once: true }}
            >
              <Link to={item.link}>
                <Card className="h-full glow-card border border-border bg-card hover:border-border/80">
                  <CardContent className="p-4 md:p-5">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${item.bg} ring-1 ${item.ring} flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110`}>
                      <item.icon className={`w-5 h-5 md:w-6 md:h-6 ${item.iconColor}`} />
                    </div>
                    <h3 className="font-bold text-foreground mb-1.5 text-sm md:text-base">{item.title}</h3>
                    <p className="text-muted-foreground text-xs md:text-sm leading-relaxed line-clamp-2">{item.description}</p>
                    <div className={`mt-3 flex items-center text-xs md:text-sm font-semibold ${item.arrowColor}`}>
                      了解更多
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SupportSection;
