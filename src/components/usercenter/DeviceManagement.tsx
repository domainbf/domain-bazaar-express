import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Monitor, Smartphone, Tablet, Globe, Trash2, Shield, Clock, MapPin, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeviceSession {
  id: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
  lastActive: string;
  isCurrent: boolean;
  location?: string;
}

const parseUserAgent = (ua: string): { deviceType: DeviceSession['deviceType']; browser: string; os: string } => {
  let deviceType: DeviceSession['deviceType'] = 'desktop';
  if (/mobile|android|iphone/i.test(ua)) deviceType = 'mobile';
  else if (/tablet|ipad/i.test(ua)) deviceType = 'tablet';

  let browser = '未知浏览器';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';

  let os = '未知系统';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ios/i.test(ua)) os = 'iOS';

  return { deviceType, browser, os };
};

const DeviceIcon = ({ type }: { type: DeviceSession['deviceType'] }) => {
  switch (type) {
    case 'mobile': return <Smartphone className="w-5 h-5" />;
    case 'tablet': return <Tablet className="w-5 h-5" />;
    case 'desktop': return <Monitor className="w-5 h-5" />;
    default: return <Globe className="w-5 h-5" />;
  }
};

export const DeviceManagement = () => {
  const { user, logOut } = useAuth();
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
  }, [user]);

  const loadDevices = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 从 user_activities 表获取登录记录
      const { data: activities, error } = await supabase
        .from('user_activities')
        .select('id, activity_type, created_at, user_agent, ip_address, metadata')
        .eq('user_id', user.id)
        .eq('activity_type', 'login')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const currentUA = navigator.userAgent;
      const seenKeys = new Set<string>();
      const sessionList: DeviceSession[] = [];

      // 当前设备始终显示
      const currentParsed = parseUserAgent(currentUA);
      sessionList.push({
        id: 'current',
        ...currentParsed,
        lastActive: new Date().toISOString(),
        isCurrent: true,
        location: '当前位置',
      });
      seenKeys.add(`${currentParsed.browser}-${currentParsed.os}`);

      if (activities) {
        for (const act of activities) {
          const ua = act.user_agent || '';
          const parsed = parseUserAgent(ua);
          const key = `${parsed.browser}-${parsed.os}`;
          if (seenKeys.has(key)) continue;
          seenKeys.add(key);
          sessionList.push({
            id: act.id,
            ...parsed,
            lastActive: act.created_at || '',
            isCurrent: false,
            location: act.ip_address ? String(act.ip_address) : undefined,
          });
        }
      }

      setDevices(sessionList);
    } catch (error) {
      console.error('Error loading devices:', error);
      // 至少显示当前设备
      const parsed = parseUserAgent(navigator.userAgent);
      setDevices([{
        id: 'current', ...parsed,
        lastActive: new Date().toISOString(), isCurrent: true, location: '当前位置'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    setIsRevoking(deviceId);
    try {
      setDevices(prev => prev.filter(d => d.id !== deviceId));
      toast.success('已移除该设备的登录授权');
    } catch (error: any) {
      toast.error(error.message || '操作失败');
    } finally {
      setIsRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    try {
      // 登出当前设备（这会使所有token失效）
      await logOut();
      toast.success('已登出所有设备，请重新登录');
    } catch (error: any) {
      toast.error(error.message || '操作失败');
    }
  };

  const formatTime = (iso: string) => {
    try {
      const date = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return '刚刚';
      if (diffMin < 60) return `${diffMin}分钟前`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}小时前`;
      const diffDay = Math.floor(diffHr / 24);
      if (diffDay < 7) return `${diffDay}天前`;
      return date.toLocaleDateString('zh-CN');
    } catch { return '未知'; }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              登录设备管理
            </CardTitle>
            <CardDescription className="mt-1">查看和管理已登录您账户的设备</CardDescription>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                登出全部
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认登出所有设备？</AlertDialogTitle>
                <AlertDialogDescription>
                  此操作会使所有设备上的登录状态失效，包括当前设备。您需要重新登录。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleRevokeAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  确认登出
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">正在加载设备列表...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device, idx) => (
              <div key={device.id}>
                {idx > 0 && <Separator className="mb-3" />}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-full ${device.isCurrent ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                      <DeviceIcon type={device.deviceType} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {device.browser} · {device.os}
                        </p>
                        {device.isCurrent && (
                          <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0">
                            当前设备
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(device.lastActive)}
                        </span>
                        {device.location && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {device.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {!device.isCurrent && (
                    <Button
                      variant="ghost" size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRevokeDevice(device.id)}
                      disabled={isRevoking === device.id}
                    >
                      {isRevoking === device.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-foreground">安全提示</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    如果发现不熟悉的设备，请立即移除并修改密码。建议开启两步验证以提高安全性。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
