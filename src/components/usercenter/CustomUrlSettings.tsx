import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Link, ExternalLink, Copy, Check, QrCode, Eye, Share2 } from 'lucide-react';

export const CustomUrlSettings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [customUrl, setCustomUrl] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedState, setCopiedState] = useState<'url' | null>(null);

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

    // 改进的验证 - 允许长度2-30字符
    if (url.length < 2 || url.length > 30) {
      setIsAvailable(false);
      setError('自定义地址长度必须在2-30字符之间');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(url)) {
      setIsAvailable(false);
      setError('仅支持字母、数字、下划线（_）和短横线（-）');
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
    const url = e.target.value.trim().toLowerCase();
    setCustomUrl(url);
    if (url) {
      checkUrlAvailability(url);
    } else {
      setError('');
      setIsAvailable(true);
    }
  };

  const saveCustomUrl = async () => {
    if (!isAvailable || !customUrl) {
      toast.error('请输入有效的自定义地址');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ custom_url: customUrl })
        .eq('id', user!.id);

      if (error) throw error;

      refreshProfile();
      toast.success('自定义地址已保存成功！');
    } catch (err: any) {
      console.error('Error saving custom URL:', err);
      toast.error(err.message || '保存自定义地址失败');
    } finally {
      setIsLoading(false);
    }
  };

  const removeCustomUrl = async () => {
    if (!profile?.custom_url) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ custom_url: null })
        .eq('id', user!.id);

      if (error) throw error;

      setCustomUrl('');
      refreshProfile();
      toast.success('自定义地址已删除');
    } catch (err: any) {
      console.error('Error removing custom URL:', err);
      toast.error(err.message || '删除自定义地址失败');
    } finally {
      setIsLoading(false);
    }
  };

  const getProfileUrl = () => {
    const baseUrl = window.location.origin;
    const urlPath = customUrl || profile?.custom_url || profile?.id;
    return `${baseUrl}/profile/${urlPath}`;
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(getProfileUrl());
      setCopiedState('url');
      toast.success('链接已复制到剪贴板');
      setTimeout(() => setCopiedState(null), 2000);
    } catch (err) {
      toast.error('复制失败，请重试');
    }
  };


  return (
    <div className="space-y-6">
      {/* 主设置卡片 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Link className="h-5 w-5 text-blue-600" />
                个性化主页链接
              </CardTitle>
              <CardDescription className="mt-2">
                创建一个易于记忆的个人主页地址，便于分享您的域名信息
              </CardDescription>
            </div>
            {profile?.custom_url && (
              <Badge className="bg-green-100 text-green-800 text-xs">已设置</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* 输入区域 */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                自定义地址
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <span className="text-gray-600 text-sm font-medium whitespace-nowrap mr-2">
                    {window.location.origin}/profile/
                  </span>
                  <Input
                    value={customUrl}
                    onChange={handleCustomUrlChange}
                    placeholder="你的昵称"
                    className="border-0 bg-transparent p-0 text-sm placeholder:text-gray-400 focus-visible:ring-0"
                  />
                </div>
                <Button
                  onClick={saveCustomUrl}
                  disabled={!isAvailable || isLoading || isChecking || !customUrl}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium sm:w-auto"
                >
                  {isLoading ? '保存中...' : '保存'}
                </Button>
              </div>

              {/* 验证反馈 */}
              {customUrl && (
                <div className="flex items-start gap-2">
                  {isChecking && (
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      检查可用性...
                    </div>
                  )}
                  {!isChecking && error && (
                    <div className="flex items-start gap-2 text-red-600 text-sm">
                      <span className="mt-0.5">⚠️</span>
                      <span>{error}</span>
                    </div>
                  )}
                  {!isChecking && !error && customUrl && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <Check className="h-4 w-4" />
                      <span>地址可用</span>
                    </div>
                  )}
                </div>
              )}

              {/* 使用说明 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <p className="font-medium mb-2">💡 小贴士：</p>
                <ul className="space-y-1 text-xs">
                  <li>• 长度必须为2-30个字符</li>
                  <li>• 只能使用字母、数字、下划线和短横线</li>
                  <li>• 地址设置后将可用于分享您的公开主页</li>
                </ul>
              </div>
            </div>

            {/* 预览区域 */}
            {(profile?.custom_url || customUrl) && (
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">预览与分享</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 链接预览 */}
                  <div className="space-y-3">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 mb-2">公开链接</p>
                      <div className="flex items-center gap-2 break-all">
                        <code className="text-sm text-gray-900 font-mono flex-1">
                          {getProfileUrl()}
                        </code>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyUrl}
                        className="flex-1 flex items-center gap-2"
                      >
                        {copiedState === 'url' ? (
                          <>
                            <Check className="h-4 w-4" />
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            复制链接
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="flex-1 flex items-center gap-2"
                      >
                        <a href={getProfileUrl()} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                          预览
                        </a>
                      </Button>
                    </div>
                  </div>

                  {/* 分享链接 */}
                  <div className="space-y-3">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 mb-3">快速分享</p>
                      <div className="text-sm text-gray-600">
                        <p className="mb-2">✓ 复制链接后分享给买家</p>
                        <p>✓ 在社交媒体中推广</p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full flex items-center gap-2"
                      asChild
                    >
                      <a href={getProfileUrl()} target="_blank" rel="noopener noreferrer">
                        <Share2 className="h-4 w-4" />
                        在新窗口打开
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 当前设置信息 */}
            {profile?.custom_url && (
              <div className="border-t pt-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-900 mb-2">✓ 当前设置</p>
                  <p className="text-sm text-green-800">
                    您的个人主页已激活，任何人都可以通过链接访问您的公开主页并查看您的域名列表。
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeCustomUrl}
                  disabled={isLoading}
                  className="mt-4 text-red-600 border-red-200 hover:bg-red-50"
                >
                  删除自定义地址
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 功能介绍卡片 */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-50 to-blue-50">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-600" />
            为什么需要自定义主页链接？
          </h3>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">1</span>
              <span><strong>易于分享：</strong> 用易记的链接代替冗长的ID，更容易与客户分享</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">2</span>
              <span><strong>专业形象：</strong> 打造个人品牌，展现专业的卖家身份</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">3</span>
              <span><strong>快速访问：</strong> 买家可快速找到您的域名，提高交易机会</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">4</span>
              <span><strong>二维码分享：</strong> 生成二维码，在社交媒体和营销中使用</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
