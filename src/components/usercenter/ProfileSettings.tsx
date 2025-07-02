
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Globe, 
  Camera,
  Save,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export const ProfileSettings = () => {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    contact_email: profile?.contact_email || user?.email || '',
    contact_phone: profile?.contact_phone || '',
    company_name: profile?.company_name || '',
    custom_url: profile?.custom_url || '',
    avatar_url: profile?.avatar_url || ''
  });

  const [sellerSettings, setSellerSettings] = useState({
    is_seller: profile?.is_seller || false,
    preferred_payment_methods: profile?.preferred_payment_methods || ['paypal', 'bank_transfer']
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSellerToggle = (enabled: boolean) => {
    setSellerSettings(prev => ({
      ...prev,
      is_seller: enabled
    }));
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      toast.error('请输入姓名');
      return false;
    }

    if (formData.username && formData.username.length < 3) {
      toast.error('用户名至少需要3个字符');
      return false;
    }

    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      toast.error('请输入有效的邮箱地址');
      return false;
    }

    if (formData.contact_phone && !/^[\d\s\-\+\(\)]+$/.test(formData.contact_phone)) {
      toast.error('请输入有效的电话号码');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const updateData = {
        ...formData,
        ...sellerSettings,
        updated_at: new Date().toISOString()
      };
      
      const success = await updateProfile(updateData);
      
      if (success) {
        toast.success('个人资料更新成功');
        await refreshProfile();
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error('更新失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const getVerificationStatus = () => {
    if (!profile) return { status: 'pending', text: '未验证', color: 'bg-gray-100 text-gray-800' };
    
    switch (profile.verification_status) {
      case 'verified':
        return { status: 'verified', text: '已验证', color: 'bg-green-100 text-green-800' };
      case 'pending':
        return { status: 'pending', text: '待验证', color: 'bg-yellow-100 text-yellow-800' };
      case 'rejected':
        return { status: 'rejected', text: '验证失败', color: 'bg-red-100 text-red-800' };
      default:
        return { status: 'pending', text: '未验证', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const verificationStatus = getVerificationStatus();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 头像和基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            基本信息
          </CardTitle>
          <CardDescription>
            管理您的个人资料和账户设置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 头像区域 */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-gray-200">
                <AvatarImage src={formData.avatar_url} alt={formData.full_name} />
                <AvatarFallback className="text-2xl">
                  {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full p-2"
                onClick={() => toast.info('头像上传功能即将推出')}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">
                  {formData.full_name || '未设置名称'}
                </h3>
                <Badge className={verificationStatus.color}>
                  {verificationStatus.text}
                </Badge>
                {profile?.is_seller && (
                  <Badge variant="outline">卖家</Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {user?.email}
              </p>
              {profile?.seller_verified && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">卖家已认证</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* 基本信息表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  姓名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="请输入您的姓名"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  用户名
                </Label>
                <Input
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="设置用户名（可选）"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  联系邮箱
                </Label>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  placeholder="your@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  联系电话
                </Label>
                <Input
                  value={formData.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  placeholder="请输入电话号码"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  公司名称
                </Label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder="请输入公司名称（可选）"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  自定义URL
                </Label>
                <Input
                  value={formData.custom_url}
                  onChange={(e) => handleInputChange('custom_url', e.target.value)}
                  placeholder="设置个人页面链接"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>个人简介</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="介绍一下您自己..."
                className="min-h-[100px]"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  保存更改
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 卖家设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            卖家设置
          </CardTitle>
          <CardDescription>
            管理您的卖家权限和销售设置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>启用卖家功能</Label>
              <p className="text-sm text-gray-600">
                开启后您可以在平台上出售域名
              </p>
            </div>
            <Switch
              checked={sellerSettings.is_seller}
              onCheckedChange={handleSellerToggle}
            />
          </div>

          {sellerSettings.is_seller && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label>卖家状态</Label>
                <div className="mt-2 flex items-center gap-2">
                  {profile?.seller_verified ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">已认证卖家</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">待认证卖家</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>销售统计</Label>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">总销售额：</span>
                    <span className="font-medium">¥{profile?.total_sales || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">卖家评分：</span>
                    <span className="font-medium">
                      {profile?.seller_rating ? `${profile.seller_rating}/5` : '暂无评分'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 账户安全 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            账户安全
          </CardTitle>
          <CardDescription>
            管理您的账户安全设置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>登录邮箱</Label>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm">
              更改邮箱
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>密码</Label>
              <p className="text-sm text-gray-600">上次更新：30天前</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/reset-password'}
            >
              更改密码
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>两步验证</Label>
              <p className="text-sm text-gray-600">为您的账户增加额外安全保护</p>
            </div>
            <Button variant="outline" size="sm" disabled>
              即将推出
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
