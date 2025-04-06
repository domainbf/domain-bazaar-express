import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CustomUrlSettings } from './CustomUrlSettings';

export const ProfileSettings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          username: username,
          bio: bio,
        })
        .eq('id', user!.id);

      if (error) throw error;

      toast.success('个人资料已更新');
      refreshProfile();
    } catch (error: any) {
      console.error('更新个人资料时出错:', error);
      toast.error(error.message || '更新个人资料失败');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">基本信息</h2>
        <div className="grid gap-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              姓名
            </label>
            <Input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              用户名
            </label>
            <Input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              简介
            </label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-black text-white hover:bg-gray-800">
          {isSaving ? '保存中...' : '保存个人资料'}
        </Button>
      </div>
      
      <CustomUrlSettings />
    </div>
  );
};
