
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from '@/components/Navbar';
import { UserProfileHeader } from '@/components/profile/UserProfileHeader';
import { UserDomainList } from '@/components/profile/UserDomainList';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfile, ProfileDomain } from "@/types/userProfile";
import { toast } from "sonner";
import { CircleDashed, CircleSlash, Mail, ShieldCheck } from "lucide-react";

export const UserProfilePage = () => {
  const { profileId } = useParams<{profileId: string}>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [domains, setDomains] = useState<ProfileDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadUserProfile = async () => {
      setIsLoading(true);
      try {
        if (!profileId) {
          toast.error('Invalid profile ID');
          return;
        }
        
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();
          
        if (profileError) {
          throw profileError;
        }
        
        setProfile(profileData as UserProfile);
        
        // Fetch user's domains
        const { data: domainsData, error: domainsError } = await supabase
          .from('domain_listings')
          .select('*')
          .eq('owner_id', profileId)
          .eq('status', 'available')
          .order('created_at', { ascending: false });
          
        if (domainsError) {
          throw domainsError;
        }
        
        setDomains(domainsData as ProfileDomain[]);
      } catch (error: any) {
        console.error('Error loading profile:', error);
        toast.error(error.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserProfile();
  }, [profileId]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-2xl font-semibold text-gray-900">User not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Profile Header */}
        <UserProfileHeader profile={profile} />
        
        {/* User Profile Content */}
        <Tabs defaultValue="domains" className="mt-6">
          <TabsList>
            <TabsTrigger value="domains">域名列表</TabsTrigger>
            <TabsTrigger value="about">关于</TabsTrigger>
          </TabsList>
          
          <TabsContent value="domains" className="mt-6">
            <UserDomainList 
              domains={domains} 
              isLoading={false} 
              emptyMessage="该用户暂无待售域名"
              showViewToggle={true}
            />
          </TabsContent>
          
          <TabsContent value="about" className="mt-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">卖家信息</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {profile.seller_verified ? (
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                  ) : (
                    <CircleSlash className="h-5 w-5 text-gray-400" />
                  )}
                  <span>
                    {profile.seller_verified ? '已通过卖家认证' : '未通过卖家认证'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <CircleDashed className="h-5 w-5 text-blue-500" />
                  <span>
                    已完成 {profile.total_sales || 0} 笔交易
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <span>
                    {profile.contact_email ? (
                      <a href={`mailto:${profile.contact_email}`} className="text-blue-600 hover:underline">
                        {profile.contact_email}
                      </a>
                    ) : (
                      '未提供联系邮箱'
                    )}
                  </span>
                </div>
              </div>
              
              {profile.bio && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">个人简介</h3>
                  <p className="text-gray-700 whitespace-pre-line">{profile.bio}</p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
