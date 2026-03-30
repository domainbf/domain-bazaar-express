import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from 'lucide-react';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl mx-auto px-4 py-8 pb-24">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">服务协议</h1>
          </div>
          <p className="text-muted-foreground text-sm">最后更新日期：2025年1月1日</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">一、总则</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>欢迎使用域见•你（NIC.BN）域名交易平台（以下简称"本平台"）。本服务协议（以下简称"本协议"）是您与本平台之间关于使用本平台服务所订立的协议。</p>
              <p>在使用本平台服务前，请您务必仔细阅读并充分理解本协议的各条款内容，特别是免除或限制责任的条款。一旦您注册账户或使用本平台任何服务，即视为您已阅读并同意本协议的全部条款。</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">二、账户注册与管理</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>2.1 您在注册账户时须提供真实、准确、完整的个人信息，并在信息发生变更时及时更新。</p>
              <p>2.2 您须妥善保管账户密码，因密码泄露导致的账户损失由您自行承担。</p>
              <p>2.3 每位用户只能注册一个账户，禁止出租、转让或出售账户。</p>
              <p>2.4 本平台有权在不事先通知的情况下，对违反本协议的账户采取暂停或终止措施。</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">三、域名交易规则</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>3.1 卖家须对所挂售域名拥有合法所有权或处置权，并保证域名信息真实准确。</p>
              <p>3.2 买家在提交报价前应充分了解域名状态，成交后不得以非本平台责任原因拒绝付款。</p>
              <p>3.3 本平台提供第三方资金托管服务，保障交易安全。资金托管规则以本平台公布的最新版本为准。</p>
              <p>3.4 域名交易完成后，双方须在约定时间内完成域名转移手续。如因卖家原因未能及时转移，本平台有权介入处理。</p>
              <p>3.5 严禁在本平台进行洗钱、欺诈、恶意竞拍等违法违规行为。</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">四、费用与结算</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>4.1 本平台收取的服务费用以平台公示的费率为准，并可能根据市场情况进行调整，调整前会提前通知用户。</p>
              <p>4.2 所有交易金额以人民币或指定货币计价，具体以交易页面显示为准。</p>
              <p>4.3 提现申请在审核通过后，将在工作日内处理，具体到账时间视银行及支付渠道而定。</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">五、禁止行为</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>您在使用本平台服务时，不得从事以下行为：</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>发布虚假域名信息或恶意抬价</li>
                <li>侵犯他人商标权、版权等知识产权</li>
                <li>利用平台进行洗钱、诈骗或其他违法行为</li>
                <li>干扰平台正常运营或攻击平台系统</li>
                <li>冒充他人身份或盗用他人账户</li>
                <li>通过技术手段绕过平台交易流程私下交易</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">六、争议处理</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>6.1 买卖双方发生争议时，应首先尝试协商解决。协商不成的，可向本平台申请介入调解。</p>
              <p>6.2 本平台将根据双方提供的证据和平台规则作出调解决定，调解结果对双方具有约束力。</p>
              <p>6.3 如调解无法解决争议，双方可向有管辖权的法院提起诉讼。</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">七、协议修改</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>本平台有权根据法律法规变化及业务需要对本协议进行修改。修改后的协议将在平台公告，自公告之日起生效。您继续使用本平台服务即视为接受修改后的协议。</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">八、联系我们</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>如您对本协议有任何疑问，请通过<a href="/contact" className="text-primary underline">联系我们</a>页面与我们取得联系。</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
