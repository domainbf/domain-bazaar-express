
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link, ExternalLink, Copy, CheckCircle, XCircle, Loader2, Info } from 'lucide-react';
import { CopyButton } from '@/components/common/CopyButton';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useDebounce } from '@/hooks/useDebounce';

export const CustomUrlSettings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [customUrl, setCustomUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const debouncedUrl = useDebounce(customUrl, 500);

  useEffect(() => {
    if (profile?.custom_url) {
      setCustomUrl(profile.custom_url);
    }
  }, [profile]);

  // Debounced availability check
  useEffect(() => {
    const checkAvailability = async () => {
      const url = debouncedUrl.trim();
      if (!url) {
        setIsAvailable(null);
        setError('');
        return;
      }

      if (url === profile?.custom_url) {
        setIsAvailable(true);
        setError('');
        return;
      }

      if (url.length < 3) {
        setIsAvailable(false);
        setError('自定义地址至少需要3个字符');
        return;
      }

      if (url.length > 30) {
        setIsAvailable(false);
        setError('自定义地址不能超过30个字符');
        return;
      }

      if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$/.test(url) && url.length > 1) {
        setIsAvailable(false);
        setError('只能包含字母、数字、下划线和短横线，不能以特殊字符开头或结尾');
        return;
      }

      if (/^[a-zA-Z0-9]$/.test(url)) {
        setIsAvailable(false);
        setError('自定义地址至少需要3个字符');
        return;
      }

      try {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('custom_url', url)
          .maybeSingle();

        setIsAvailable(!data);
        setError(data ? '该自定义地址已被使用' : '');
      } catch (err) {
        console.error('Error checking URL availability:', err);
        setError('检查可用性时出错');
      }
    };

    checkAvailability();
  }, [debouncedUrl, profile?.custom_url]);

  const handleCustomUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value.trim().toLowerCase();
    setCustomUrl(url);
  };

  const saveCustomUrl = async () => {
    if (isAvailable === false) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ custom_url: customUrl || null, updated_at: new Date().toISOString() })
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

  const clearCustomUrl = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ custom_url: null, updated_at: new Date().toISOString() })
        .eq('id', user!.id);

      if (error) throw error;

      setCustomUrl('');
      setIsAvailable(null);
      setError('');
      refreshProfile();
      toast.success('自定义地址已清除');
    } catch (err: any) {
      toast.error('清除失败');
    } finally {
      setIsLoading(false);
    }
  };

  const getProfileUrl = () => {
    const baseUrl = window.location.origin;
    const urlPath = customUrl || profile?.custom_url || profile?.id;
    return `${baseUrl}/profile/${urlPath}`;
  };

  const isChecking = debouncedUrl !== customUrl;
  const hasChanged = customUrl !== (profile?.custom_url || '');
  const canSave = hasChanged && isAvailable !== false && !isChecking && customUrl.length >= 3;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          自定义个人主页地址
        </CardTitle>
        <CardDescription>
          设置一个容易记忆的个性化链接，方便分享您的个人主页
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* 当前状态 */}
        {profile?.custom_url && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">当前地址</p>
                <p className="text-sm font-medium truncate">
                  {window.location.origin}/profile/<span className="text-primary">{profile.custom_url}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <CopyButton text={`${window.location.origin}/profile/${profile.custom_url}`} />
              <a
                href={`${window.location.origin}/profile/${profile.custom_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-muted rounded-md transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            </div>
          </div>
        )}

        {/* 输入区域 */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            自定义地址
            <Badge variant="secondary" className="text-xs font-normal">
              3-30个字符
            </Badge>
          </Label>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted/50 border rounded-l-md px-3 h-10 text-sm text-muted-foreground shrink-0 border-r-0">
              /profile/
            </div>
            <div className="relative flex-1">
              <Input
                value={customUrl}
                onChange={handleCustomUrlChange}
                placeholder="your-custom-url"
                className={`rounded-l-none ${
                  error ? 'border-destructive focus-visible:ring-destructive' : 
                  isAvailable === true && hasChanged ? 'border-green-500 focus-visible:ring-green-500' : ''
                }`}
                maxLength={30}
              />
              {/* 状态指示器 */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isChecking && customUrl ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : error ? (
                  <XCircle className="h-4 w-4 text-destructive" />
                ) : isAvailable === true && hasChanged ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : null}
              </div>
            </div>
          </div>
          
          {/* 状态消息 */}
          {error && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <XCircle className="h-3 w-3" /> {error}
            </p>
          )}
          {!error && isAvailable === true && hasChanged && (
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> 该地址可用
            </p>
          )}
        </div>

        {/* 实时预览 */}
        {customUrl && !error && (
          <Alert className="bg-primary/5 border-primary/20">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <span className="text-xs text-muted-foreground">预览地址：</span>
              <code className="ml-1 text-sm text-primary break-all">
                {getProfileUrl()}
              </code>
            </AlertDescription>
          </Alert>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center gap-3">
          <Button
            onClick={saveCustomUrl}
            disabled={!canSave || isLoading}
            className="flex-1 sm:flex-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              '保存自定义地址'
            )}
          </Button>
          {profile?.custom_url && (
            <Button
              variant="outline"
              onClick={clearCustomUrl}
              disabled={isLoading}
              className="text-destructive hover:text-destructive"
            >
              清除地址
            </Button>
          )}
        </div>

        <Separator />

        {/* 使用说明 */}
        <div className="text-xs text-muted-foreground space-y-1.5">
          <p className="font-medium text-foreground/80">使用说明</p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>自定义地址可让您更方便地分享个人主页</li>
            <li>地址只能包含字母、数字、下划线（_）和短横线（-）</li>
            <li>您的个人主页将展示所有在售域名</li>
            <li>清除自定义地址后，将恢复使用默认的用户ID链接</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
