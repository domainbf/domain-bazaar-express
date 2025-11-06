import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Award,
  ExternalLink,
  BookOpen,
  Lightbulb,
  Target,
  Calendar
} from 'lucide-react';

const Community: React.FC = () => {
  const topContributors = [
    { name: '域名专家张三', contributions: 128, badge: 'VIP会员' },
    { name: '交易达人李四', contributions: 95, badge: '高级卖家' },
    { name: '新手导师王五', contributions: 87, badge: '认证卖家' },
  ];

  const popularTopics = [
    { 
      title: '如何评估域名的真实价值？', 
      category: '域名评估', 
      replies: 45, 
      views: 892,
      lastActivity: '2小时前'
    },
    { 
      title: '.bn域名的投资前景分析', 
      category: '投资交流', 
      replies: 32, 
      views: 654,
      lastActivity: '5小时前'
    },
    { 
      title: '域名转让流程详解', 
      category: '新手指南', 
      replies: 28, 
      views: 521,
      lastActivity: '1天前'
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Users className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-4">用户社区</h1>
          <p className="text-xl text-muted-foreground">与其他域名投资者交流经验，分享心得</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要内容区 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 社区统计 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  社区动态
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-primary/5 rounded-lg">
                    <div className="text-3xl font-bold text-primary">2,847</div>
                    <div className="text-sm text-muted-foreground mt-1">活跃用户</div>
                  </div>
                  <div className="text-center p-4 bg-primary/5 rounded-lg">
                    <div className="text-3xl font-bold text-primary">15,392</div>
                    <div className="text-sm text-muted-foreground mt-1">讨论主题</div>
                  </div>
                  <div className="text-center p-4 bg-primary/5 rounded-lg">
                    <div className="text-3xl font-bold text-primary">89,541</div>
                    <div className="text-sm text-muted-foreground mt-1">交流回复</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 热门话题 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  热门话题
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {popularTopics.map((topic, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold hover:text-primary transition-colors mb-2">
                          {topic.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <Badge variant="outline">{topic.category}</Badge>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {topic.replies} 回复
                          </span>
                          <span>{topic.views} 浏览</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {topic.lastActivity}
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  查看更多话题
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* 社区板块 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  社区板块
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <Lightbulb className="h-8 w-8 text-yellow-500" />
                    <div>
                      <div className="font-medium">新手入门</div>
                      <div className="text-sm text-muted-foreground">域名基础知识</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <Target className="h-8 w-8 text-blue-500" />
                    <div>
                      <div className="font-medium">投资交流</div>
                      <div className="text-sm text-muted-foreground">分享投资经验</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <MessageSquare className="h-8 w-8 text-green-500" />
                    <div>
                      <div className="font-medium">交易咨询</div>
                      <div className="text-sm text-muted-foreground">买卖问题解答</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <Award className="h-8 w-8 text-purple-500" />
                    <div>
                      <div className="font-medium">成功案例</div>
                      <div className="text-sm text-muted-foreground">交易故事分享</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 社区指南 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">社区指南</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>尊重其他用户，保持友善交流</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>分享真实经验，避免虚假信息</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>不发布广告或垃圾内容</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>保护个人隐私，谨慎交易</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-3" size="sm">
                  查看完整规则
                </Button>
              </CardContent>
            </Card>

            {/* 活跃贡献者 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  活跃贡献者
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topContributors.map((user, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{user.name}</div>
                      <Badge variant="secondary" className="text-xs mt-1">{user.badge}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.contributions}贡献
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 快速链接 */}
            <Card className="bg-primary/5">
              <CardContent className="pt-6 space-y-2">
                <Button variant="default" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  发起新话题
                </Button>
                <Button variant="outline" className="w-full">
                  <BookOpen className="h-4 w-4 mr-2" />
                  社区规则
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 提示信息 */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">社区功能开发中</p>
                <p>我们正在打造一个活跃的域名交易社区，敬请期待！如有建议或想法，欢迎通过客服联系我们。</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Community;
