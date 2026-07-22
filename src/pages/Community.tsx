import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  MessageSquare,
  BookOpen,
  Lightbulb,
  Target,
  Award,
  Sparkles,
  Mail,
} from 'lucide-react';

const BOARDS = [
  { icon: Lightbulb, color: 'text-yellow-500', title: '新手入门', desc: '域名基础知识与常见问答' },
  { icon: Target, color: 'text-blue-500', title: '投资交流', desc: '分享挑域名、估值与投资经验' },
  { icon: MessageSquare, color: 'text-green-500', title: '交易咨询', desc: '买卖流程、议价与过户答疑' },
  { icon: Award, color: 'text-purple-500', title: '成功案例', desc: '真实的域名成交故事与复盘' },
];

const GUIDELINES = [
  '尊重其他用户，保持友善交流',
  '分享真实经验，避免虚假信息',
  '不发布广告或垃圾内容',
  '保护个人隐私，谨慎交易',
];

const Community: React.FC = () => {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Users className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-4">用户社区</h1>
          <p className="text-xl text-muted-foreground">与其他域名投资者交流经验、分享心得</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">社区论坛筹备中</p>
                    <p className="text-sm text-muted-foreground">
                      我们正在打造一个真实、健康的域名交流社区。目前你可以通过工单向我们提交想法、
                      话题建议或加入内测名单，我们会在功能开放时第一时间通知你。
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button asChild size="sm">
                        <Link to="/support?type=community">
                          <MessageSquare className="h-4 w-4 mr-1.5" />
                          提交话题或建议
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link to="/faq">
                          <BookOpen className="h-4 w-4 mr-1.5" />
                          查看常见问题
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  规划中的板块
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {BOARDS.map((b) => (
                    <div
                      key={b.title}
                      className="flex items-center gap-3 p-3 border border-border rounded-lg"
                    >
                      <b.icon className={`h-8 w-8 ${b.color}`} />
                      <div>
                        <div className="font-medium">{b.title}</div>
                        <div className="text-sm text-muted-foreground">{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  论坛上线后，这些板块将支持发帖、回复、点赞与内容审核。
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">社区公约（草案）</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="text-sm space-y-2">
                  {GUIDELINES.map((g) => (
                    <li key={g} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" size="sm" className="w-full mt-3">
                  <Link to="/faq">查看完整规则</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  联系我们
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>希望加入社区内测、或成为版主/贡献者？</p>
                <Button asChild size="sm" className="w-full">
                  <Link to="/support?type=community">申请加入内测</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
