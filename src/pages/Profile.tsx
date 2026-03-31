import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, User, Mail, Building, Phone, Star } from 'lucide-react';
import { UserReviews } from '@/components/reviews/ReviewSystem';

export const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    bio: '',
    contact_email: '',
    contact_phone: '',
    company_name: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        contact_email: profile.contact_email || user?.email || '',
        contact_phone: profile.contact_phone || '',
        company_name: profile.company_name || '',
      });
    }
  }, [profile, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user?.id);

      if (error) throw error;
      
      await refreshProfile();
      toast.success('个人资料更新成功！');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || '更新失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8">个人资料</h1>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="profile">基本信息</TabsTrigger>
            <TabsTrigger value="account">账户设置</TabsTrigger>
            <TabsTrigger value="seller">卖家设置</TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5" />
              我收到的评价
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <h2 className="text-xl font-semibold mb-6">基本信息</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" /> 姓名
                    </label>
                    <Input
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" /> 用户名
                    </label>
                    <Input
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" /> 联系邮箱
                    </label>
                    <Input
                      name="contact_email"
                      type="email"
                      autoComplete="email"
                      value={formData.contact_email}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4" /> 联系电话
                    </label>
                    <Input
                      name="contact_phone"
                      type="tel"
                      autoComplete="tel"
                      value={formData.contact_phone}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Building className="w-4 h-4" /> 公司名称
                    </label>
                    <Input
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">个人简介</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full rounded-md border border-input p-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="animate-spin w-4 h-4" />
                      保存中...
                    </span>
                  ) : (
                    '保存更改'
                  )}
                </Button>
              </form>
            </div>
          </TabsContent>
          
          <TabsContent value="account">
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <h2 className="text-xl font-semibold mb-6">账户设置</h2>
              <p className="mb-4 text-muted-foreground">邮箱：{user?.email}</p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">修改密码</h3>
                  <Button variant="outline">修改密码</Button>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2 text-destructive">危险操作</h3>
                  <Button variant="destructive">删除账户</Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="seller">
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <h2 className="text-xl font-semibold mb-6">卖家设置</h2>
              
              <div className="mb-6">
                <p className="mb-2">卖家状态：{profile?.is_seller ? '已激活' : '未开通'}</p>
                {!profile?.is_seller && (
                  <Button>成为卖家</Button>
                )}
              </div>
              
              {profile?.is_seller && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">收款方式</h3>
                    <div className="p-4 border border-border rounded-md bg-muted/50">
                      <p className="text-muted-foreground">配置您的域名销售收款方式</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">认证状态</h3>
                    <div className="p-4 border border-border rounded-md bg-muted/50">
                      <p className="text-muted-foreground">状态：{profile?.verification_status || '未认证'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="reviews">
            {user && (
              <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  我收到的评价
                </h2>
                <UserReviews userId={user.id} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
