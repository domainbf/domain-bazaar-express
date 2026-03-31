import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const CustomContent = ({ text }: { text: string }) => (
  <div className="space-y-4">
    {text.split('\n\n').filter(p => p.trim()).map((para, i) => (
      <Card key={i}>
        <CardContent className="pt-5 pb-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {para.trim()}
        </CardContent>
      </Card>
    ))}
  </div>
);

const PrivacyPage = () => {
  const { config } = useSiteSettings();
  const customContent = config.legal_privacy_content?.trim();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl mx-auto px-4 py-8 pb-24">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">隐私政策</h1>
          </div>
          <p className="text-muted-foreground text-sm">最后更新日期：2025年3月1日 &nbsp;|&nbsp; 生效日期：2025年3月15日</p>
          <p className="text-muted-foreground text-sm mt-1">本政策适用于域见·你（NIC.RW）提供的所有服务，包括网站、移动端及 API 接口。</p>
        </div>

        {customContent ? (
          <CustomContent text={customContent} />
        ) : (
          <div className="space-y-6">

            <Card>
              <CardHeader><CardTitle className="text-lg">一、概述与适用范围</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>域见·你（NIC.RW，以下简称"平台"或"我们"）深知个人信息对您的重要性，我们承诺依据中华人民共和国《个人信息保护法》《网络安全法》《数据安全法》及其他适用法律法规，采取严格的安全保护措施处理您的个人信息。</p>
                <p>本隐私政策适用于您通过网站（nic.rw）、移动应用、API 接口或其他方式使用本平台服务的全部场景。请在使用前仔细阅读，尤其关注以<strong>加粗</strong>或下划线标注的条款——这些条款涉及您的重要权利和义务。</p>
                <p>如您对本政策有任何疑问，请通过<a href="/contact" className="text-primary underline">联系我们</a>页面与我们取得联系，我们将在 5 个工作日内给予答复。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">二、我们收集的个人信息</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p><strong>2.1 您主动提供的信息</strong></p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong>账户注册信息：</strong>电子邮件地址、用户名、密码（加密存储）、手机号码（可选）；</li>
                  <li><strong>实名认证信息：</strong>完成提现或高额交易时，我们可能要求您提供真实姓名、身份证号码或营业执照信息；</li>
                  <li><strong>域名挂售信息：</strong>您填写的域名描述、价格、联系方式等；</li>
                  <li><strong>支付信息：</strong>银行卡号、支付宝账号、微信账号等收款信息（我们不存储完整的银行卡号）；</li>
                  <li><strong>通讯内容：</strong>您通过站内消息、客服工单与其他用户或平台的沟通内容；</li>
                  <li><strong>反馈与调查：</strong>您主动提交的意见、建议或问卷回答。</li>
                </ul>
                <p><strong>2.2 我们自动收集的信息</strong></p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong>设备与网络信息：</strong>IP 地址、设备型号、操作系统版本、浏览器类型与版本、网络运营商；</li>
                  <li><strong>日志信息：</strong>访问时间、页面停留时长、点击路径、搜索关键词、错误日志；</li>
                  <li><strong>Cookie 与类似技术：</strong>用于维持登录状态、记住偏好设置及统计访问数据（详见第八条）；</li>
                  <li><strong>交易行为数据：</strong>报价历史、浏览记录、收藏列表、竞拍出价记录。</li>
                </ul>
                <p><strong>2.3 来自第三方的信息</strong></p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>当您使用 Google 账号登录时，我们会获取您在 Google 授权范围内的基本信息（邮箱、头像）；</li>
                  <li>域名 WHOIS 公开数据，用于验证域名所有权；</li>
                  <li>支付渠道提供的交易验证结果。</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">三、信息的使用目的</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>我们仅在必要范围内使用您的信息，具体目的包括：</p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li><strong>提供核心服务：</strong>注册与登录、域名交易撮合、资金托管与结算、域名所有权验证；</li>
                  <li><strong>安全保障：</strong>身份验证、反欺诈检测、异常登录识别、防止洗钱行为；</li>
                  <li><strong>服务通知：</strong>交易状态更新、报价通知、账户安全提醒（通过邮件或站内通知）；</li>
                  <li><strong>客户服务：</strong>处理您的投诉、申诉和咨询，记录服务沟通历史；</li>
                  <li><strong>产品改进：</strong>分析用户行为数据，优化界面设计和功能体验；</li>
                  <li><strong>合规义务：</strong>遵守反洗钱（AML）、了解客户（KYC）等监管要求，配合执法机关的合法调查；</li>
                  <li><strong>营销与推广（需您同意）：</strong>发送平台活动、促销信息（您可随时取消订阅）。</li>
                </ul>
                <p>我们不会将您的个人信息用于上述目的以外的其他场景，如有变更，将通过本政策更新等方式事先通知您。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">四、信息共享与对外披露</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p><strong>4.1 我们不出售您的个人信息。</strong>以下情形除外，我们不会将您的信息提供给任何第三方：</p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li><strong>交易必要信息：</strong>域名转移过程中，须向买家/卖家提供授权码和必要的联系信息；向域名注册商提供买家信息以完成过户手续；</li>
                  <li><strong>支付处理：</strong>将必要的交易信息传递给支付渠道合作方（如银行、支付宝、微信支付）以完成资金收付；</li>
                  <li><strong>服务提供商：</strong>我们委托的技术服务商（云存储、CDN、邮件服务等），这些服务商仅被授权用于提供特定服务，须签署保密协议；</li>
                  <li><strong>法律要求：</strong>依据生效的法院命令、政府部门的合法要求或法律规定进行的信息披露；</li>
                  <li><strong>保护权益：</strong>为保护平台、用户或公众的合法权益，在必要时披露相关信息；</li>
                  <li><strong>企业重组：</strong>在合并、收购或资产转让场景下，受让方将继承本隐私政策义务。</li>
                </ul>
                <p><strong>4.2 公开展示的信息：</strong>您在平台发布的域名挂售信息（域名名称、价格、分类等）将对所有访客公开展示，请谨慎填写敏感信息。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">五、信息存储与跨境传输</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p><strong>5.1 存储地点：</strong>您的个人信息主要存储于中国境内和境外的云服务器（包括 Turso、Supabase 等服务商），这些服务商均符合行业安全标准。</p>
                <p><strong>5.2 跨境传输：</strong>由于域名交易的国际性质，您的部分信息（如域名转移所需的联系信息）可能需要传输至境外的域名注册商。我们会确保接收方对数据提供不低于本政策的保护水平。</p>
                <p><strong>5.3 保留期限：</strong></p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>账户信息：账户存续期间保留；账户注销后保留 30 天，之后匿名化处理；</li>
                  <li>交易记录：依据法律法规要求，保留至少 5 年；</li>
                  <li>日志信息：通常保留 6 个月；</li>
                  <li>客服沟通记录：保留 3 年，用于纠纷复查。</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">六、信息安全保护措施</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>我们采用多层次技术和管理措施保护您的信息：</p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li><strong>传输加密：</strong>所有通信使用 TLS 1.2+ 加密；</li>
                  <li><strong>存储加密：</strong>密码使用 bcrypt 加盐哈希存储，支付敏感信息加密存储；</li>
                  <li><strong>访问控制：</strong>员工按最小权限原则访问数据，所有操作有审计日志；</li>
                  <li><strong>安全审计：</strong>定期进行渗透测试和代码安全审查；</li>
                  <li><strong>灾备机制：</strong>数据定期备份，确保可恢复性；</li>
                  <li><strong>漏洞响应：</strong>如发现数据安全漏洞，将在 72 小时内按规定通知监管机构，并及时向可能受影响的用户发出通知。</li>
                </ul>
                <p>尽管如此，互联网环境本身存在不可控因素，我们无法保证 100% 的安全性。请您也注意妥善保管账号密码，避免在公共设备上保持登录状态。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">七、您对个人信息的权利</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>依据适用法律，您对自己的个人信息享有以下权利：</p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li><strong>知情权与访问权：</strong>了解我们持有哪些关于您的信息，并请求获取副本；</li>
                  <li><strong>更正权：</strong>要求更正不准确或不完整的个人信息；</li>
                  <li><strong>删除权（被遗忘权）：</strong>在满足法定条件时，要求我们删除您的个人信息；</li>
                  <li><strong>限制处理权：</strong>在特定情形下，要求限制对您信息的处理；</li>
                  <li><strong>可携带权：</strong>以结构化、通用格式获取您提供的个人信息；</li>
                  <li><strong>撤回同意权：</strong>对于基于您同意进行的信息处理，您可随时撤回同意，不影响撤回前的处理合法性；</li>
                  <li><strong>投诉权：</strong>向主管的数据保护监管机构提出投诉。</li>
                </ul>
                <p>行使上述权利请通过<a href="/contact" className="text-primary underline">联系我们</a>提交请求。我们将在 15 个工作日内响应（情况复杂时最长延至 30 个工作日，届时会告知原因）。</p>
                <p><strong>注意：</strong>部分删除请求可能因法律合规义务（如交易记录保留要求）而无法完全执行。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">八、Cookie 及类似技术</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>我们使用以下类型的 Cookie 和本地存储技术：</p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li><strong>必要型 Cookie：</strong>维持会话状态、保障安全登录，无法关闭（关闭会导致无法正常使用服务）；</li>
                  <li><strong>功能型 Cookie：</strong>记住您的语言偏好、货币设置、主题模式等；</li>
                  <li><strong>统计分析 Cookie：</strong>收集匿名化的访问量数据，用于改进产品（可在浏览器设置中关闭）；</li>
                  <li><strong>LocalStorage：</strong>存储登录令牌和用户偏好配置，清除浏览器数据会导致需重新登录。</li>
                </ul>
                <p>您可以通过浏览器设置管理 Cookie。请注意，完全禁用 Cookie 可能导致部分功能无法正常使用。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">九、未成年人保护</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>本平台服务面向 18 周岁及以上的成年用户。我们不会故意收集未成年人的个人信息。</p>
                <p>如发现账号为未成年人所注册，请家长或监护人及时联系我们。经核实后，我们将采取必要措施删除相关信息并关闭账号。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">十、政策更新与通知</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>我们可能根据法律法规变化、业务调整或产品迭代对本政策进行修订。</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong>重大变更：</strong>通过平台首页公告、注册邮件通知等方式提前 30 天告知；</li>
                  <li><strong>一般性更新：</strong>在本页面更新修订日期，建议定期查看；</li>
                  <li><strong>继续使用视为同意：</strong>政策生效后继续使用服务，即视为接受新版本政策。</li>
                </ul>
                <p>历史版本可在页面底部归档链接中查阅。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">十一、联系我们</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
                <p>如您对本隐私政策有任何问题或意见，请通过以下方式联系我们：</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>在线工单：<a href="/contact" className="text-primary underline">联系我们</a>页面</li>
                  <li>客服邮箱：support@nic.rw</li>
                </ul>
                <p>我们在收到请求后 5 个工作日内响应。</p>
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacyPage;
