import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
  AlertCircle,
  Loader2,
  Upload,
  MapPin,
  Linkedin,
  Twitter,
  MessageCircle,
  FileText
} from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export const ProfileSettings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    // 基本信息
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    contact_email: profile?.contact_email || user?.email || '',
    contact_phone: profile?.contact_phone || '',
    avatar_url: profile?.avatar_url || '',
    
    // 公司和位置信息
    company_name: profile?.company_name || '',
    address: (profile as any)?.address || '',
    country: (profile as any)?.country || '',
    city: (profile as any)?.city || '',
    
    // 网络和社交媒体
    website_url: (profile as any)?.website_url || '',
    twitter: (profile as any)?.twitter || '',
    linkedin: (profile as any)?.linkedin || '',
    wechat: (profile as any)?.wechat || '',
    qq: (profile as any)?.qq || '',
    
    // 其他
    language_preference: (profile as any)?.language_preference || 'zh'
  });

  const [sellerSettings, setSellerSettings] = useState({
    is_seller: profile?.is_seller || false,
    preferred_payment_methods: profile?.preferred_payment_methods || ['paypal', 'bank_transfer'],
    seller_description: (profile as any)?.seller_description || '',
    business_license: (profile as any)?.business_license || ''
  });

  // 头像上传配置
  const MAX_FILE_SIZE = 500 * 1024; // 500KB 限制
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('仅支持 JPG、PNG、GIF、WebP 格式的图片');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`图片大小不能超过 ${MAX_FILE_SIZE / 1024}KB`);
      return;
    }

    setIsUploadingAvatar(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket')) {
          toast.error('头像存储功能正在配置中，请稍后再试');
          return;
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      toast.success('头像上传成功');
      await refreshProfile();
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error(`头像上传失败: ${error.message}`);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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

    if (formData.website_url && !/^https?:\/\/.+/.test(formData.website_url)) {
      toast.error('请输入有效的网址（需要以 http:// 或 https:// 开头）');
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
      
      // 过滤掉空字符串
      const cleanedData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      );
      
      const { error } = await supabase
        .from('profiles')
        .update(cleanedData)
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('个人资料更新成功');
      await refreshProfile();
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || '更新失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const getVerificationStatus = () => {
    if (!profile) return { status: 'pending', text: '未认证', color: 'bg-gray-100 text-gray-800' };
    
    switch (profile.verification_status) {
      case 'verified':
        return { status: 'verified', text: '已认证', color: 'bg-green-100 text-green-800' };
      case 'pending':
        return { status: 'pending', text: '待认证', color: 'bg-yellow-100 text-yellow-800' };
      case 'rejected':
        return { status: 'rejected', text: '认证失败', color: 'bg-red-100 text-red-800' };
      default:
        return { status: 'pending', text: '未认证', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const verificationStatus = getVerificationStatus();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 头像和基本信息卡片 */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            {/* 头像区域 */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                <AvatarImage src={formData.avatar_url} alt={formData.full_name} />
                <AvatarFallback className="text-4xl font-bold bg-blue-600 text-white">
                  {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
              />
              <Button
                size="sm"
                className="absolute -bottom-3 -right-3 rounded-full p-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* 个人信息概览 */}
            <div className="flex-1 space-y-4 text-center sm:text-left">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {formData.full_name || '请设置名称'}
                </h2>
                <p className="text-gray-600 mt-1">{user?.email}</p>
              </div>
              
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <Badge className={verificationStatus.color}>
                  {verificationStatus.text}
                </Badge>
                {profile?.is_seller && (
                  <Badge variant="secondary">卖家身份</Badge>
                )}
                {profile?.seller_verified && (
                  <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    已认证卖家
                  </Badge>
                )}
              </div>

              <p className="text-sm text-gray-600">
                {formData.bio || '暂无个人简介'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 基本信息表单 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b bg-gray-50">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            个人信息
          </CardTitle>
          <CardDescription>
            管理和编辑您的个人资料信息
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 基本信息组 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-medium">
                    <User className="h-4 w-4" />
                    姓名 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="请输入您的姓名"
                    className="border-gray-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-medium">用户名</Label>
                  <Input
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="唯一用户名（3-20字符）"
                    className="border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-medium">
                    <Mail className="h-4 w-4" />
                    联系邮箱
                  </Label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="your@example.com"
                    className="border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-medium">
                    <Phone className="h-4 w-4" />
                    联系电话
                  </Label>
                  <Input
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    placeholder="+86 10 1234 5678"
                    className="border-gray-200"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Label className="font-medium">个人简介</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="介绍一下您自己和您的专业背景..."
                  className="min-h-[100px] border-gray-200"
                />
              </div>
            </div>

            <Separator />

            {/* 公司和位置信息 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">公司和位置信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-medium">
                    <Building2 className="h-4 w-4" />
                    公司名称
                  </Label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="您的公司或品牌名称"
                    className="border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-medium">
                    <MapPin className="h-4 w-4" />
                    国家/地区
                  </Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="例如：中国"
                    className="border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-medium">
                    <MapPin className="h-4 w-4" />
                    城市
                  </Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="例如：北京"
                    className="border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-medium">详细地址</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="您的办公地址（可选）"
                    className="border-gray-200"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* 网络和社交媒体 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">网络和社交媒体</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-medium">
                    <Globe className="h-4 w-4" />
                    个人网站
                  </Label>
                  <Input
                    value={formData.website_url}
                    onChange={(e) => handleInputChange('website_url', e.target.value)}
                    placeholder="https://example.com"
                    className="border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-medium">
                    <Twitter className="h-4 w-4" />
                    Twitter/X
                  </Label>
                  <Input
                    value={formData.twitter}
                    onChange={(e) => handleInputChange('twitter', e.target.value)}
                    placeholder="@username"
                    className="border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-medium">
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </Label>
                  <Input
                    value={formData.linkedin}
                    onChange={(e) => handleInputChange('linkedin', e.target.value)}
                    placeholder="linkedin.com/in/username"
                    className="border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-medium">
                    <MessageCircle className="h-4 w-4" />
                    微信
                  </Label>
                  <Input
                    value={formData.wechat}
                    onChange={(e) => handleInputChange('wechat', e.target.value)}
                    placeholder="微信账号"
                    className="border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-medium">QQ</Label>
                  <Input
                    value={formData.qq}
                    onChange={(e) => handleInputChange('qq', e.target.value)}
                    placeholder="QQ号码"
                    className="border-gray-200"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* 卖家信息 */}
            {profile?.is_seller && (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">卖家信息</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 font-medium">
                        <FileText className="h-4 w-4" />
                        卖家描述
                      </Label>
                      <Textarea
                        value={sellerSettings.seller_description}
                        onChange={(e) => setSellerSettings(prev => ({ ...prev, seller_description: e.target.value }))}
                        placeholder="介绍您作为卖家的优势和专业信息..."
                        className="min-h-[100px] border-gray-200"
                      />
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* 提交按钮 */}
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  保存所有更改
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 账户安全卡片 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b bg-gray-50">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            账户安全
          </CardTitle>
          <CardDescription>
            管理您的账户安全设置
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1">
              <Label className="font-medium">登录邮箱</Label>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm" disabled>
              已配置
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1">
              <Label className="font-medium">密码</Label>
              <p className="text-sm text-gray-600">定期更改密码以保护账户安全</p>
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

          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="space-y-1">
              <Label className="font-medium">两步验证</Label>
              <p className="text-sm text-blue-600">增加账户安全性</p>
            </div>
            <Button variant="outline" size="sm" disabled className="text-blue-600">
              即将推出
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
