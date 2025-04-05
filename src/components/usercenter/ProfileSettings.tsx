
import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Upload, 
  ShieldCheck, 
  KeySquare, 
  AlertTriangle
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const ProfileSettings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [contactEmail, setContactEmail] = useState(profile?.contact_email || user?.email || '');
  const [contactPhone, setContactPhone] = useState(profile?.contact_phone || '');
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [verificationFiles, setVerificationFiles] = useState<FileList | null>(null);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // First update basic profile info
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          username: username,
          bio: bio,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          company_name: companyName,
        })
        .eq('id', user!.id);

      if (error) throw error;

      // Next upload avatar if changed
      if (avatarFile) {
        // Delete old avatar first
        if (profile?.avatar_url) {
          const oldAvatarPath = profile.avatar_url.split('/').pop();
          if (oldAvatarPath) {
            await supabase.storage.from('avatars').remove([oldAvatarPath]);
          }
        }
        
        // Upload new avatar
        const fileName = `${user!.id}-${Date.now()}.${avatarFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);
          
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        
        // Update profile with new avatar URL
        const { error: updateAvatarError } = await supabase
          .from('profiles')
          .update({
            avatar_url: publicUrlData.publicUrl
          })
          .eq('id', user!.id);
          
        if (updateAvatarError) throw updateAvatarError;
      }

      toast.success('个人资料已更新');
      refreshProfile();
    } catch (error: any) {
      console.error('更新个人资料时出错:', error);
      toast.error(error.message || '更新个人资料失败');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleChangePassword = async () => {
    setIsChangingPassword(true);
    try {
      if (newPassword !== confirmPassword) {
        toast.error('新密码与确认密码不匹配');
        return;
      }
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast.success('密码已成功更新');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('更新密码时出错:', error);
      toast.error(error.message || '更新密码失败');
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };
  
  const handleVerificationRequest = async () => {
    if (!verificationFiles || verificationFiles.length === 0) {
      toast.error('请上传验证文件');
      return;
    }
    
    setIsSaving(true);
    try {
      // Upload verification documents
      const uploads = [];
      const fileUrls = [];
      
      for (let i = 0; i < verificationFiles.length; i++) {
        const file = verificationFiles[i];
        const fileName = `${user!.id}-${Date.now()}-${i}.${file.name.split('.').pop()}`;
        
        // Upload file
        const { error: uploadError } = await supabase.storage
          .from('verification_documents')
          .upload(fileName, file);
          
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: publicUrlData } = supabase.storage.from('verification_documents').getPublicUrl(fileName);
        fileUrls.push(publicUrlData.publicUrl);
      }
      
      // Update profile verification status
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'pending',
          verification_documents: fileUrls
        })
        .eq('id', user!.id);
        
      if (error) throw error;
      
      toast.success('验证请求已提交，请等待审核');
      setIsVerificationDialogOpen(false);
      refreshProfile();
    } catch (error: any) {
      console.error('提交验证请求时出错:', error);
      toast.error(error.message || '提交验证请求失败');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="security">安全设置</TabsTrigger>
          <TabsTrigger value="verification">身份验证</TabsTrigger>
        </TabsList>
      
        <TabsContent value="basic">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Avatar Card */}
            <Card>
              <CardHeader>
                <CardTitle>头像</CardTitle>
                <CardDescription>设置您的个人头像</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt="Avatar" 
                        className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute bottom-0 right-0 rounded-full p-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-sm text-gray-500">推荐使用正方形图片，最大文件大小为2MB</p>
                </div>
              </CardContent>
            </Card>

            {/* Basic Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>个人信息</CardTitle>
                <CardDescription>设置您的基本个人信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">姓名</Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-9"
                      placeholder="输入您的姓名"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">用户名</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">@</span>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-9"
                      placeholder="输入您的用户名"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">联系邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="pl-9"
                      placeholder="输入您的邮箱地址"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>业务信息</CardTitle>
                <CardDescription>设置您的业务和联系信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">公司名称</Label>
                  <div className="relative">
                    <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="pl-9"
                      placeholder="输入您的公司名称"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">联系电话</Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="phone"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="pl-9"
                      placeholder="输入您的联系电话"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bio Card */}
            <Card>
              <CardHeader>
                <CardTitle>个人简介</CardTitle>
                <CardDescription>介绍一下您自己</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="min-h-[120px]"
                  placeholder="输入您的个人简介"
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleSaveProfile} 
              disabled={isSaving} 
              className="bg-black text-white hover:bg-gray-800"
            >
              {isSaving ? '保存中...' : '保存个人资料'}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>修改密码</CardTitle>
              <CardDescription>更新您的账户密码</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">新密码</Label>
                <div className="relative">
                  <KeySquare className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-9"
                    placeholder="输入新密码"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认密码</Label>
                <div className="relative">
                  <KeySquare className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9"
                    placeholder="再次输入新密码"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={handleChangePassword} 
                disabled={isChangingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="bg-black text-white hover:bg-gray-800"
              >
                {isChangingPassword ? '更新中...' : '更新密码'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="verification">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>身份验证</CardTitle>
                  <CardDescription>验证您的卖家身份</CardDescription>
                </div>
                {profile?.verification_status === 'verified' && (
                  <Badge variant="verified" className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> 已验证
                  </Badge>
                )}
                {profile?.verification_status === 'pending' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> 审核中
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile?.verification_status === 'verified' ? (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="flex items-center text-green-700">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    您的卖家身份已通过验证，可以发布域名出售。
                  </p>
                </div>
              ) : profile?.verification_status === 'pending' ? (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="flex items-center text-yellow-700">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    您的验证申请正在审核中，请耐心等待。
                  </p>
                </div>
              ) : (
                <>
                  <p>为了保障平台安全，在出售域名前需要验证您的身份。请提供相关证明文件，如：</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600">
                    <li>个人身份证/护照/驾照</li>
                    <li>企业营业执照</li>
                    <li>域名所有权证明文件</li>
                  </ul>
                  <Button
                    onClick={() => setIsVerificationDialogOpen(true)}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    开始验证
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Verification Dialog */}
      <Dialog open={isVerificationDialogOpen} onOpenChange={setIsVerificationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>提交身份验证</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="verification-docs">上传证明文件</Label>
              <Input
                id="verification-docs"
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => setVerificationFiles(e.target.files)}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">支持图片和PDF文件，最大10MB</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsVerificationDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleVerificationRequest}
              disabled={!verificationFiles || verificationFiles.length === 0 || isSaving}
              className="bg-black text-white hover:bg-gray-800"
            >
              {isSaving ? '提交中...' : '提交验证'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
