import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from 'lucide-react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl mx-auto px-4 py-8 pb-24">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">隐私政策</h1>
          </div>
          <p className="text-muted-foreground text-sm">最后更新日期：2025年1月1日</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">一、概述</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>域见•你（NIC.BN）深知个人信息对您的重要性，我们将按照法律法规的规定，采取相应的安全保护措施来保护您的个人信息。本隐私政策适用于您使用本平台的所有服务。</p>
              <p>请在使用本平台服务前仔细阅读本隐私政策，了解我们如何收集、使用和保护您的信息。</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">二、我们收集的信息</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>2.1 <strong>注册信息：</strong>您注册账户时提供的电子邮件地址、用户名等基本信息。</p>
              <p>2.2 <strong>交易信息：</strong>您在平台上进行的域名交易记录、报价记录、拍卖参与记录等。</p>
              <p>2.3 <strong>身份验证信息：</strong>为保证交易安全，我们可能需要您提供身份证明材料。</p>
              <p>2.4 <strong>设备信息：</strong>我们可能收集您使用的设备类型、操作系统、浏览器类型、IP地址等技术信息。</p>
              <p>2.5 <strong>日志信息：</strong>您使用平台服务的操作日志，包括访问时间、浏览记录等。</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">三、信息的使用方式</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>我们收集您的信息用于以下目的：</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>提供、维护和改善平台服务</li>
                <li>处理域名交易，完成资金结算</li>
                <li>发送服务通知、交易确认及安全提醒</li>
                <li>进行身份验证，防止欺诈行为</li>
                <li>提供客户服务和争议解决支持</li>
                <li>遵守法律法规义务及监管要求</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">四、信息共享与披露</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>4.1 我们不会将您的个人信息出售给第三方。</p>
              <p>4.2 在以下情况下，我们可能向第三方披露您的信息：</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>获得您的明确同意</li>
                <li>配合执法机关依法调查</li>
                <li>保护本平台、用户或公众的合法权益</li>
                <li>完成域名交易所必须的信息传递（如域名注册商信息）</li>
              </ul>
              <p>4.3 我们可能与合作的服务提供商共享信息，但这些服务商仅被授权用于为我们提供服务，不得将信息用于其他目的。</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">五、信息安全</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>5.1 我们采用业界标准的技术措施保护您的个人信息，包括SSL加密传输、数据加密存储、访问控制等。</p>
              <p>5.2 我们定期审查信息收集、存储和处理流程，确保安全措施持续有效。</p>
              <p>5.3 尽管我们采取了合理的安全措施，但互联网并非完全安全的环境，如发现信息安全漏洞，我们将及时通知您。</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">六、您的权利</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>您对您的个人信息拥有以下权利：</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong>访问权：</strong>查看我们持有的关于您的个人信息</li>
                <li><strong>更正权：</strong>更正不准确的个人信息</li>
                <li><strong>删除权：</strong>在特定情况下要求删除您的个人信息</li>
                <li><strong>撤回同意权：</strong>撤回您对我们处理信息的授权（不影响撤回前的合法处理）</li>
                <li><strong>投诉权：</strong>向相关监管机构投诉我们的数据处理行为</li>
              </ul>
              <p>如需行使上述权利，请通过<a href="/contact" className="text-primary underline">联系我们</a>页面提交申请。</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">七、Cookie 使用</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>我们使用 Cookie 及类似技术来改善您的使用体验，包括记住您的登录状态、分析平台使用情况等。您可以通过浏览器设置管理 Cookie，但关闭 Cookie 可能影响某些功能的正常使用。</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">八、政策更新</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>我们可能定期修订本隐私政策。重大变更时，我们将通过平台公告或向您发送通知的方式告知您。建议您定期查看本政策的最新版本。</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
