
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link, ExternalLink } from 'lucide-react';
import { CopyButton } from '@/components/common/CopyButton';

export const CustomUrlSettings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [customUrl, setCustomUrl] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (profile?.custom_url) {
      setCustomUrl(profile.custom_url);
    }
  }, [profile]);
  
  const checkUrlAvailability = async (url: string) => {
    if (!url) {
      setIsAvailable(true);
      setError('');
      return;
    }
    
    if (url === profile?.custom_url) {
      setIsAvailable(true);
      setError('');
      return;
    }
    
    // Basic validation
    if (!/^[a-zA-Z0-9_-]+$/.test(url)) {
      setIsAvailable(false);
      setError('自定义地址只能包含字母、数字、下划线和短横线');
      return;
    }
    
    setIsChecking(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('custom_url', url)
        .maybeSingle();
        
      setIsAvailable(!data);
      setError(data ? '该自定义地址已被使用' : '');
    } catch (err) {
      console.error('Error checking URL availability:', err);
      setError('检查地址可用性时出错');
    } finally {
      setIsChecking(false);
    }
  };
  
  const handleCustomUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value.trim();
    setCustomUrl(url);
    checkUrlAvailability(url);
  };
  
  const saveCustomUrl = async () => {
    if (!isAvailable) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ custom_url: customUrl || null })
        .eq('id', user!.id);
        
      if (error) throw error;
      
      refreshProfile();
      toast.success('自定义地址已保存');
    } catch (err: any) {
      console.error('Error saving custom URL:', err);
      toast.error(err.message || '保存自定义地址失败');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getProfileUrl = () => {
    const baseUrl = window.location.origin;
    const urlPath = profile?.custom_url || profile?.id;
    return `${baseUrl}/profile/${urlPath}`;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          自定义个人主页地址
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              自定义地址
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0 text-gray-500">
                {window.location.origin}/profile/
              </div>
              <Input 
                value={customUrl}
                onChange={handleCustomUrlChange}
                placeholder="your-custom-url"
                className={`flex-1 ${error ? 'border-red-300 focus:ring-red-300' : ''}`}
              />
            </div>
            
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
            
            {isChecking && (
              <p className="mt-1 text-sm text-gray-500">检查可用性...</p>
            )}
            
            {!error && !isChecking && customUrl && (
              <p className="mt-1 text-sm text-green-600">自定义地址可用</p>
            )}
          </div>
          
          {(profile?.custom_url || profile?.id) && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="flex flex-col space-y-2">
                <div className="text-sm">您的个人主页地址：</div>
                <div className="flex items-center gap-2">
                  <code className="bg-blue-100 px-2 py-1 rounded text-blue-800 text-sm break-all">
                    {getProfileUrl()}
                  </code>
                  <CopyButton text={getProfileUrl()} />
                  <a href={getProfileUrl()} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <Button 
            onClick={saveCustomUrl}
            disabled={!isAvailable || isLoading || isChecking}
            className="w-full md:w-auto"
          >
            {isLoading ? '保存中...' : '保存自定义地址'}
          </Button>
          
          <div className="text-sm text-gray-500 space-y-1">
            <p>自定义地址可让您更方便地分享您的个人主页。</p>
            <p>您的个人主页将展示您所有在售的域名。</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
