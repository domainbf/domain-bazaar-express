import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Shield, 
  Lock, 
  Key, 
  AlertTriangle, 
  CheckCircle2,
  Eye,
  Smartphone,
  Mail,
  FileText,
  HelpCircle
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const SecurityCenter: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Shield className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-4">安全中心</h1>
          <p className="text-xl text-muted-foreground">保护您的账户安全，了解安全最佳实践</p>
        </div>

        {/* 安全状态概览 */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              账户安全状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                <Lock className="h-8 w-8 text-green-500" />
                <div>
                  <div className="font-medium">密码强度</div>
                  <Badge variant="outline" className="mt-1">建议增强</Badge>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                <Smartphone className="h-8 w-8 text-blue-500" />
                <div>
                  <div className="font-medium">两步验证</div>
                  <Badge variant="outline" className="mt-1">未启用</Badge>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                <Mail className="h-8 w-8 text-green-500" />
                <div>
                  <div className="font-medium">邮箱验证</div>
                  <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">已验证</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 安全指南 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              账户安全指引
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="password">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    如何设置强密码？
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-2">
                  <p>强密码应该具备以下特征：</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>至少包含8个字符</li>
                    <li>包含大写字母、小写字母、数字和特殊字符</li>
                    <li>不使用常见单词或个人信息</li>
                    <li>不与其他网站使用相同密码</li>
                    <li>定期更换密码（建议3-6个月更换一次）</li>
                  </ul>
                  <div className="bg-amber-50 p-3 rounded-lg mt-3 border border-amber-200">
                    <p className="text-amber-800 text-sm flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>建议使用密码管理器来生成和存储复杂密码</span>
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="2fa">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-primary" />
                    什么是两步验证？如何启用？
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-2">
                  <p>两步验证（2FA）为您的账户增加额外的安全层。即使有人知道您的密码，没有第二步验证码也无法登录。</p>
                  <p className="font-medium mt-3">启用步骤：</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>前往 用户中心 → 个人资料 → 账户安全</li>
                    <li>点击"启用两步验证"</li>
                    <li>使用验证器应用（如Google Authenticator）扫描二维码</li>
                    <li>输入验证码完成设置</li>
                  </ol>
                  <div className="bg-blue-50 p-3 rounded-lg mt-3 border border-blue-200">
                    <p className="text-blue-800 text-sm">
                      推荐使用：Google Authenticator、Microsoft Authenticator 或 Authy
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="phishing">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    如何识别钓鱼邮件和诈骗？
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-2">
                  <p>请注意以下可疑迹象：</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>发件人地址看起来不正规（检查@后的域名）</li>
                    <li>邮件内容有紧迫感或威胁性语气</li>
                    <li>要求点击可疑链接或下载附件</li>
                    <li>要求提供密码、验证码等敏感信息</li>
                    <li>存在拼写或语法错误</li>
                  </ul>
                  <div className="bg-red-50 p-3 rounded-lg mt-3 border border-red-200">
                    <p className="text-red-800 text-sm font-medium">
                      重要提醒：NIC.BN 永远不会通过邮件要求您提供密码或验证码！
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="session">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    如何管理登录设备和会话？
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-2">
                  <p>定期检查和管理登录设备可以提高账户安全：</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>前往 用户中心 → 个人资料 → 账户安全 → 登录设备</li>
                    <li>查看所有活跃的登录会话</li>
                    <li>移除不认识的设备或位置</li>
                    <li>使用公共设备后务必退出登录</li>
                  </ul>
                  <p className="mt-3">如果发现可疑登录活动，请立即：</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>更改密码</li>
                    <li>终止所有会话</li>
                    <li>启用两步验证</li>
                    <li>联系客服报告情况</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="privacy">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    如何保护个人隐私信息？
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-2">
                  <p>保护个人信息的建议：</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>不要在公开资料中显示真实联系方式</li>
                    <li>谨慎设置域名whois信息的可见性</li>
                    <li>使用平台内消息系统沟通，避免直接交换联系方式</li>
                    <li>定期检查和更新隐私设置</li>
                    <li>不要分享账户登录信息给任何人</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="transaction">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    交易安全注意事项
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-2">
                  <p>进行域名交易时的安全建议：</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>只通过平台官方渠道进行交易</li>
                    <li>使用平台提供的担保交易服务</li>
                    <li>谨慎对待价格明显低于市场价的域名</li>
                    <li>交易前验证卖家身份和域名所有权</li>
                    <li>保留所有交易记录和沟通证据</li>
                    <li>遇到纠纷及时联系平台客服</li>
                  </ul>
                  <div className="bg-amber-50 p-3 rounded-lg mt-3 border border-amber-200">
                    <p className="text-amber-800 text-sm">
                      任何要求线下转账或绕过平台交易的行为都可能是诈骗！
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* 紧急情况处理 */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              账户被盗或发现可疑活动？
            </CardTitle>
          </CardHeader>
          <CardContent className="text-red-800">
            <p className="mb-3">如果您发现账户异常或疑似被盗，请立即采取以下措施：</p>
            <ol className="list-decimal list-inside space-y-1 mb-4">
              <li>立即更改密码</li>
              <li>终止所有登录会话</li>
              <li>检查并更新联系邮箱</li>
              <li>联系紧急服务热线</li>
            </ol>
            <div className="bg-red-100 p-4 rounded-lg border border-red-300">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="h-5 w-5" />
                <span className="font-bold text-lg">紧急服务热线</span>
              </div>
              <p className="text-2xl font-bold">+673-999-0000</p>
              <p className="text-sm mt-1">24小时紧急服务热线</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecurityCenter;
