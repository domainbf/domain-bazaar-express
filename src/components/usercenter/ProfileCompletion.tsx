import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CompletionItem {
  key: string;
  label: string;
  done: boolean;
  tab?: string;
  action?: () => void;
}

interface ProfileCompletionProps {
  onNavigateTab?: (tab: string) => void;
}

export const ProfileCompletion = ({ onNavigateTab }: ProfileCompletionProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  if (!user || !profile) return null;

  const goToProfile = () => {
    if (onNavigateTab) {
      onNavigateTab('profile');
    } else {
      navigate('/user-center?tab=profile');
    }
  };

  const items: CompletionItem[] = [
    { key: 'email', label: '绑定邮箱', done: !!user.email },
    { key: 'full_name', label: '填写真实姓名', done: !!profile.full_name?.trim() },
    { key: 'avatar', label: '上传头像', done: !!profile.avatar_url },
    { key: 'bio', label: '填写个人简介', done: !!profile.bio?.trim() },
    { key: 'contact_phone', label: '绑定手机号', done: !!profile.contact_phone?.trim() },
    { key: 'seller', label: '开启卖家功能', done: !!profile.is_seller },
  ];

  const completed = items.filter(i => i.done).length;
  const percent = Math.round((completed / items.length) * 100);

  if (percent === 100) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 mb-5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold text-sm">完善资料，解锁更多功能</span>
              <span className="text-xs text-primary font-medium ml-auto shrink-0">{percent}%</span>
            </div>
            <Progress value={percent} className="h-1.5 mb-3" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {items.map(item => (
                <div key={item.key} className={`flex items-center gap-1.5 text-xs ${item.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {item.done
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    : <Circle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  }
                  {item.label}
                </div>
              ))}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={goToProfile} className="shrink-0 gap-1 text-xs">
            去完善
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
