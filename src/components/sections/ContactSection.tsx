
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const ContactSection = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <section className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-cyan-400 mb-6">
              联系我们
            </h2>
            <p className="text-muted-foreground mb-8">
              无论您有任何问题或建议，我们都随时准备为您提供专业的咨询服务
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-violet-500/10">
                  <Phone className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <div className="text-foreground font-medium">电话咨询</div>
                  <div className="text-muted-foreground">400-123-4567</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-cyan-500/10">
                  <Mail className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <div className="text-foreground font-medium">邮件支持</div>
                  <div className="text-muted-foreground">support@example.com</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-amber-500/10">
                  <MessageSquare className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="text-foreground font-medium">在线客服</div>
                  <div className="text-muted-foreground">7x24小时在线服务</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="glass-card p-8 rounded-xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  您的姓名
                </label>
                <Input 
                  type="text"
                  autoComplete="name"
                  placeholder="请输入您的姓名"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  联系邮箱
                </label>
                <Input 
                  type="email"
                  autoComplete="email"
                  placeholder="请输入您的邮箱"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  咨询内容
                </label>
                <textarea 
                  rows={4}
                  placeholder="请详细描述您的需求"
                  className="w-full bg-background border border-input text-foreground placeholder:text-muted-foreground rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all duration-200 resize-none"
                />
              </div>
              
              <Button 
                type="submit"
                className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600"
              >
                提交咨询
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
