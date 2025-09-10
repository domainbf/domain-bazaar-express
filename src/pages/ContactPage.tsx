
import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send,
  MessageCircle,
  Headphones,
  Globe,
  Shield,
  Users,
  Building
} from 'lucide-react';

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  category: string;
  message: string;
}

const contactCategories = [
  { value: 'general', label: '一般咨询' },
  { value: 'technical', label: '技术支持' },
  { value: 'billing', label: '账单问题' },
  { value: 'domain', label: '域名问题' },
  { value: 'verification', label: '验证问题' },
  { value: 'transaction', label: '交易纠纷' },
  { value: 'partnership', label: '合作洽谈' },
  { value: 'other', label: '其他问题' }
];

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    category: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('请输入您的姓名');
      return false;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('请输入有效的邮箱地址');
      return false;
    }
    if (!formData.subject.trim()) {
      toast.error('请输入主题');
      return false;
    }
    if (!formData.category) {
      toast.error('请选择问题类型');
      return false;
    }
    if (!formData.message.trim()) {
      toast.error('请输入详细描述');
      return false;
    }
    if (formData.message.trim().length < 10) {
      toast.error('详细描述至少需要10个字符');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // 模拟提交延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 这里应该调用实际的API
      console.log('Contact form submitted:', formData);
      
      toast.success('消息发送成功！我们会在24小时内回复您。');
      
      // 重置表单
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        category: '',
        message: ''
      });
    } catch (error) {
      toast.error('发送失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">联系我们</h1>
          <p className="text-xl text-gray-600">我们随时为您提供帮助和支持</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 联系表单 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  发送消息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        姓名 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="请输入您的姓名"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        邮箱 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">电话</label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="请输入联系电话（可选）"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        问题类型 <span className="text-red-500">*</span>
                      </label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => handleInputChange('category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="请选择问题类型" />
                        </SelectTrigger>
                        <SelectContent>
                          {contactCategories.map(category => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      主题 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="简要描述您的问题"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      详细描述 <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="请详细描述您遇到的问题或需要的帮助..."
                      className="min-h-[120px]"
                      required
                    />
                    <div className="text-xs text-gray-500">
                      {formData.message.length}/500
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        发送中...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        发送消息
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* 联系信息和其他支持方式 */}
          <div className="space-y-6">
            {/* 联系方式 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  联系方式
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-gray-500 mt-1" />
                  <div>
                    <div className="font-medium">客服邮箱</div>
                    <div className="text-gray-600">support@nic.bn</div>
                    <div className="text-sm text-gray-500">24小时内回复</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-500 mt-1" />
                  <div>
                    <div className="font-medium">客服电话</div>
                    <div className="text-gray-600">+673-123-4567</div>
                    <div className="text-sm text-gray-500">周一至周五 9:00-18:00</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-500 mt-1" />
                  <div>
                    <div className="font-medium">公司地址</div>
                    <div className="text-gray-600">
                      文莱达鲁萨兰国<br />
                      信息通信技术发展局
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 工作时间 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  服务时间
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>在线客服</span>
                  <span className="text-gray-600">9:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span>邮箱支持</span>
                  <span className="text-gray-600">24小时</span>
                </div>
                <div className="flex justify-between">
                  <span>电话支持</span>
                  <span className="text-gray-600">9:00 - 18:00</span>
                </div>
                <div className="text-sm text-gray-500 pt-2 border-t">
                  周一至周五（节假日除外）
                </div>
              </CardContent>
            </Card>

            {/* 其他支持方式 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="h-5 w-5" />
                  其他支持
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Globe className="h-6 w-6 text-blue-500" />
                    <div>
                      <div className="font-medium">在线帮助中心</div>
                      <div className="text-sm text-gray-600">查看常见问题</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Users className="h-6 w-6 text-green-500" />
                    <div>
                      <div className="font-medium">用户社区</div>
                      <div className="text-sm text-gray-600">与其他用户交流</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Shield className="h-6 w-6 text-purple-500" />
                    <div>
                      <div className="font-medium">安全中心</div>
                      <div className="text-sm text-gray-600">账户安全指引</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 紧急联系 */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  紧急情况
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700 text-sm">
                  如遇到账户安全问题或紧急交易纠纷，
                  请立即拨打紧急热线：
                </p>
                <div className="font-bold text-red-800 text-lg mt-2">
                  +673-999-0000
                </div>
                <p className="text-red-600 text-xs mt-1">
                  24小时紧急服务热线
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
