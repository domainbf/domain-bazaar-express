
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from '@/components/Navbar';
import { UserProfileHeader } from '@/components/profile/UserProfileHeader';
import { UserDomainList } from '@/components/profile/UserDomainList';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { UserProfile, ProfileDomain } from '@/types/userProfile';
import { toast } from 'sonner';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const UserProfilePage = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [domains, setDomains] = useState<ProfileDomain[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadUserProfile = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // First try to fetch by custom_url
        let { data: profileByUrl, error: urlError } = await supabase
          .from('profiles')
          .select('*')
          .eq('custom_url', profileId)
          .single();
        
        // If not found by custom_url, try by id
        if (urlError) {
          const { data: profileById, error: idError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profileId)
            .single();
            
          if (idError) {
            setError('找不到该用户资料');
            setIsLoading(false);
            return;
          }
          
          profileByUrl = profileById;
        }
        
        setProfile(profileByUrl);
        
        // Fetch the user's available domains
        const { data: domainData, error: domainError } = await supabase
          .from('domain_listings')
          .select('*')
          .eq('owner_id', profileByUrl.id)
          .eq('status', 'available')
          .eq('verification_status', 'verified');
          
        if (domainError) throw domainError;
        
        setDomains(domainData || []);
      } catch (error: any) {
        console.error('Error loading user profile:', error);
        toast.error('加载用户资料时出错');
        setError('加载用户资料时出错');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (profileId) {
      loadUserProfile();
    }
  }, [profileId]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }
  
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>
              {error || '找不到该用户资料'}
            </AlertDescription>
          </Alert>
          
          <div className="mt-6">
            <Link to="/">
              <Button variant="outline" className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                返回首页
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <UserProfileHeader profile={profile} />
        
        <div className="mt-8">
          <UserDomainList domains={domains} />
        </div>
        
        {domains.length === 0 && (
          <div className="mt-8 text-center py-12 bg-white rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">该用户暂无在售域名</h3>
            <p className="mt-2 text-sm text-gray-500">返回首页或浏览其他用户的域名</p>
            <div className="mt-6">
              <Link to="/">
                <Button className="mx-auto">浏览更多域名</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
