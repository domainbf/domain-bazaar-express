import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserProfile } from "@/types/userProfile";
import { User } from "@supabase/supabase-js";
import { 
  UserCircle, 
  Mail, 
  Shield, 
  Calendar,
  MapPin,
  Briefcase,
  Phone,
  Globe
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface UserCenterLayoutProps {
  profile: UserProfile | null;
  user: User;
  children: React.ReactNode;
}

export const UserCenterLayout = ({ profile, user, children }: UserCenterLayoutProps) => {
  const getVerificationBadge = () => {
    if (profile?.seller_verified) {
      return <Badge className="bg-green-100 text-green-800 text-xs">已认证卖家</Badge>;
    }
    if (profile?.is_seller) {
      return <Badge variant="secondary" className="text-xs">卖家</Badge>;
    }
    return <Badge variant="outline" className="text-xs">普通用户</Badge>;
  };

  const getMembershipLevel = () => {
    const level = profile?.account_level || 'basic';
    const levelConfig = {
      basic: { label: '基础会员', color: 'bg-gray-100 text-gray-800' },
      premium: { label: '高级会员', color: 'bg-blue-100 text-blue-800' },
      vip: { label: 'VIP会员', color: 'bg-purple-100 text-purple-800' }
    };
    const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.basic;
    
    return <Badge className={`${config.color} text-xs`}>{config.label}</Badge>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* 用户信息头部 */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* 用户头像和基本信息 */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="用户头像" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    <UserCircle className="w-8 h-8" />
                  </div>
                )}
                {profile?.verification_status === 'verified' && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile?.full_name || user?.email?.split('@')[0] || '用户'}
                  </h1>
                  {profile?.username && (
                    <p className="text-sm text-gray-600">@{profile.username}</p>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {getVerificationBadge()}
                  {getMembershipLevel()}
                  {profile?.is_admin && (
                    <Badge className="bg-red-100 text-red-800 text-xs">管理员</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* 用户详细信息 */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{profile?.contact_email || user?.email}</span>
                </div>
                
                {profile?.contact_phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{profile.contact_phone}</span>
                  </div>
                )}
                
                {profile?.company_name && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Briefcase className="w-4 h-4" />
                    <span>{profile.company_name}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    加入于 {formatDistanceToNow(new Date(profile?.created_at || user?.created_at || ''), {
                      addSuffix: true,
                      locale: zhCN
                    })}
                  </span>
                </div>
                
                {profile?.custom_url && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Globe className="w-4 h-4" />
                    <a 
                      href={`https://nic.bn/${profile.custom_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      nic.bn/{profile.custom_url}
                    </a>
                  </div>
                )}
                
                {profile?.bio && (
                  <div className="mt-3">
                    <p className="text-gray-700 text-sm line-clamp-2">{profile.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 主要内容区域 */}
      {children}
    </div>
  );
};