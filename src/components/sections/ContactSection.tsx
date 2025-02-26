
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const ContactSection = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 处理表单提交
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
            <p className="text-gray-400 mb-8">
              无论您有任何问题或建议，我们都随时准备为您提供专业的咨询服务
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-violet-500/10">
                  <Phone className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <div className="text-white font-medium">电话咨询</div>
                  <div className="text-gray-400">400-123-4567</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-cyan-500/10">
                  <Mail className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <div className="text-white font-medium">邮件支持</div>
                  <div className="text-gray-400">support@example.com</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-amber-500/10">
                  <MessageSquare className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="text-white font-medium">在线客服</div>
                  <div className="text-gray-400">7x24小时在线服务</div>
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  您的姓名
                </label>
                <Input 
                  type="text" 
                  placeholder="请输入您的姓名"
                  className="w-full bg-white/5 border-violet-500/20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  联系邮箱
                </label>
                <Input 
                  type="email" 
                  placeholder="请输入您的邮箱"
                  className="w-full bg-white/5 border-violet-500/20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  咨询内容
                </label>
                <textarea 
                  rows={4}
                  placeholder="请详细描述您的需求"
                  className="w-full bg-white/5 border-violet-500/20 rounded-md p-3 text-white"
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
