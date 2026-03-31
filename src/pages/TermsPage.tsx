import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from 'lucide-react';
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

const TermsPage = () => {
  const { config } = useSiteSettings();
  const customContent = config.legal_terms_content?.trim();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl mx-auto px-4 py-8 pb-24">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">用户服务协议</h1>
          </div>
          <p className="text-muted-foreground text-sm">最后更新日期：2025年3月1日 &nbsp;|&nbsp; 生效日期：2025年3月15日</p>
          <p className="text-muted-foreground text-sm mt-1">
            本协议是您与域见·你（NIC.RW）之间关于使用本平台全部服务所订立的法律文件，请在使用前务必仔细阅读。
          </p>
        </div>

        {customContent ? (
          <CustomContent text={customContent} />
        ) : (
          <div className="space-y-6">

            <Card>
              <CardHeader><CardTitle className="text-lg">一、总则</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>欢迎使用域见·你（NIC.RW）域名交易平台（以下简称"本平台"或"我们"）。本服务协议（以下简称"本协议"）是您（以下简称"用户"或"您"）与本平台之间关于使用本平台域名交易、域名竞拍、资金托管、域名评估等各项服务所订立的协议。</p>
                <p><strong>在使用本平台任何服务前，请务必仔细阅读并充分理解本协议各条款。一旦您注册账户、使用任何服务或以其他方式表示接受，即视为您已阅读、理解并同意接受本协议的全部条款及条件的约束。</strong></p>
                <p>如您不同意本协议任何条款，请立即停止使用本平台服务。如您是代表企业或其他法律实体使用本服务，则您声明并保证您有权代表该实体签署本协议。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">二、账户注册与管理</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p><strong>2.1 注册资格：</strong>您须年满 18 周岁且具有完全民事行为能力，方可注册并使用本平台服务。未成年人须在监护人监督下使用，监护人须承担相应法律责任。</p>
                <p><strong>2.2 信息真实性：</strong>注册时须提供真实、准确、完整的个人信息，并在信息变更时及时更新。因提供虚假信息导致的一切损失由您自行承担，本平台保留暂停或终止您账户的权利。</p>
                <p><strong>2.3 账户安全：</strong>您须妥善保管账户密码，不得将账户转让、出租、出售或授权他人使用。因密码保管不当导致的账户损失或由此产生的法律责任由您自行承担。</p>
                <p><strong>2.4 一人一号：</strong>每位自然人或法人主体仅允许注册一个账户。发现同一主体多号操作的，平台有权合并或注销多余账户。</p>
                <p><strong>2.5 账户安全事件：</strong>如发现账户被盗用或其他安全异常，须立即通知本平台，我们将协助处置。在通知前产生的损失，平台不承担责任。</p>
                <p><strong>2.6 账户暂停与终止：</strong>本平台有权在以下情形下，不经事先通知暂停或终止账户：违反本协议条款、涉嫌欺诈或违法行为、长期不活跃（超过 24 个月）、收到有效的法律投诉。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">三、域名挂售与发布规则</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p><strong>3.1 所有权保证：</strong>挂售域名的用户（卖家）须保证对所挂售域名拥有合法完整的所有权或有权处置该域名，域名上不存在任何法律纠纷、权利限制或第三方主张。</p>
                <p><strong>3.2 信息真实：</strong>卖家须确保域名描述、历史数据等挂售信息真实准确，不得包含虚假、误导性陈述或隐瞒影响域名价值的重要信息（如搜索引擎惩罚历史、商标纠纷等）。</p>
                <p><strong>3.3 验证要求：</strong>平台要求卖家完成域名所有权验证方可发布域名，以保障买家权益。验证方式包括 DNS TXT 记录、HTML 文件及注册邮箱验证三种。</p>
                <p><strong>3.4 禁止挂售的域名类型：</strong>以下类型域名不得在本平台挂售：</p>
                <ul className="list-disc list-inside space-y-1 pl-4">
                  <li>含有色情、赌博、毒品等违法内容的域名；</li>
                  <li>涉及国家机关、知名品牌商标的抢注域名（仅正当持有除外）；</li>
                  <li>被法院裁定、UDRP 仲裁判定或相关机构要求转移的域名；</li>
                  <li>处于注册局锁定状态（Status: serverTransferProhibited）的域名；</li>
                  <li>已过期或处于续费宽限期内的域名。</li>
                </ul>
                <p><strong>3.5 价格与修改：</strong>卖家可随时修改挂牌价格和域名信息，但已进入托管付款阶段的交易不得单方面修改价格。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">四、域名竞拍规则</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p><strong>4.1 参与资格：</strong>参与竞拍须在平台完成账户注册并预存规定比例的竞拍保证金。</p>
                <p><strong>4.2 出价规则：</strong>每次出价须高于当前最高出价；出价一旦提交不可撤销；拍卖进行中出现新出价时，倒计时将延长，防止恶意狙击。</p>
                <p><strong>4.3 保证金规则：</strong>竞拍失败者的保证金在拍卖结束后 24 小时内退还；竞拍成功后未在规定时间内完成付款，保证金不予退还，且账户可能受到处罚。</p>
                <p><strong>4.4 成交义务：</strong>拍卖结束后，最高出价者须在 48 小时内完成付款，否则视为违约，保证金没收，由次高出价者顺位补充。</p>
                <p><strong>4.5 流拍处理：</strong>若拍卖未达到卖家设定的保留价（Reserve Price），拍卖结果视为流拍，所有参与者保证金退还。卖家和最高出价者可在流拍后进行私下谈判（仍须通过平台托管成交）。</p>
                <p><strong>4.6 禁止操纵：</strong>严禁利用多账号或与他人串通进行虚假出价、抬高价格等操纵拍卖行为，一经发现将永久封禁账号并追缴相关款项。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">五、资金托管与交易结算</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p><strong>5.1 托管机制：</strong>买家付款后，资金存入平台指定的第三方托管账户，待域名成功转移并经买家确认后，平台方可向卖家划付款项。</p>
                <p><strong>5.2 买家付款期限：</strong>交易确认后，买家须在 72 小时内完成付款，逾期视为放弃，平台有权取消该交易并将域名重新上架。</p>
                <p><strong>5.3 卖家转移期限：</strong>收到买家付款通知后，卖家须在 48 小时内提供域名转移授权码（EPP Code）及配合完成转移操作；未能按时完成者视为违约。</p>
                <p><strong>5.4 买家确认期：</strong>域名转移完成后，买家有 3 个工作日的确认期。确认无误后款项划付给卖家；若买家在确认期内未提出异议，系统自动视为确认并放款。</p>
                <p><strong>5.5 款项划付：</strong>款项划付至卖家的平台余额，卖家可申请提现至绑定账户，处理时间为 1~3 个工作日。</p>
                <p><strong>5.6 交易取消退款：</strong>双方协商取消的交易，款项在 3~5 个工作日内退还原路支付。因卖家违约导致的交易取消，全额退款给买家，且卖家须承担相应违约责任。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">六、费用与结算说明</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p><strong>6.1 服务费：</strong>平台对成交交易向卖家收取成交金额的 5%（含税）作为服务费，买家无需支付额外费用。</p>
                <p><strong>6.2 费率调整：</strong>平台有权调整服务费率，但须提前 30 天通过公告通知用户，调整不影响调整前已完成的交易。</p>
                <p><strong>6.3 退款手续费：</strong>因买家原因（非平台或卖家责任）申请退款，可能产生支付渠道退款手续费，由买家承担。</p>
                <p><strong>6.4 汇率与货币：</strong>平台以人民币（CNY）计价为主，支持多种货币展示换算，换算结果仅供参考，实际结算以合同约定货币为准。</p>
                <p><strong>6.5 发票：</strong>平台可应用户申请开具服务费增值税普通发票，请在付款时备注发票抬头和税号。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">七、禁止行为</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>您在使用本平台服务时，不得从事以下行为（包括但不限于）：</p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li>发布虚假域名信息，蓄意欺骗买家；</li>
                  <li>侵犯他人商标权、著作权、专利权等知识产权；</li>
                  <li>利用平台进行洗钱、诈骗、逃税或其他违法行为；</li>
                  <li>通过技术手段（爬虫、脚本等）非法抓取平台数据；</li>
                  <li>对平台系统实施攻击、渗透或干扰其正常运营；</li>
                  <li>冒充平台工作人员或他人身份进行欺诈；</li>
                  <li>绕过平台托管流程进行私下交易（平台不对此类交易提供任何保障）；</li>
                  <li>恶意举报他人域名或批量发起无实质根据的申诉；</li>
                  <li>利用多账号规避平台规则、账户处罚或刷取好评；</li>
                  <li>发布任何含有病毒、木马或其他恶意代码的内容；</li>
                  <li>传播政治敏感、色情、暴恐等违法违规内容。</li>
                </ul>
                <p>违反上述规定的，平台有权立即暂停或终止账户、冻结相关资金，并保留追究法律责任的权利。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">八、知识产权</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p><strong>8.1 平台权利：</strong>本平台的界面设计、Logo、商标、代码、数据库结构、文案内容等均属于本平台或其授权方的知识产权，受法律保护。未经明确书面授权，不得复制、修改、展示或用于任何商业目的。</p>
                <p><strong>8.2 用户内容：</strong>您在平台发布的域名描述、评价等内容的版权归您所有，但您授予本平台在全球范围内、非独家的、免版税的许可，以用于平台运营目的（包括展示、推广、数据分析等）。</p>
                <p><strong>8.3 域名本身：</strong>域名本身不构成本协议所保护的知识产权对象，域名的权利状态应以注册局的记录为准。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">九、纠纷处理机制</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p><strong>9.1 友好协商：</strong>买卖双方发生争议时，应首先在 3 个工作日内尝试友好协商解决。</p>
                <p><strong>9.2 平台调解：</strong>协商不成的，任一方可向本平台申请介入调解。平台将在 5~10 个工作日内收集双方证据并作出调解建议。调解结果对双方具有建议性约束力；如双方均接受调解结果，则按结果执行。</p>
                <p><strong>9.3 证据规则：</strong>平台保存的交易记录、通讯记录、系统日志等数据在调解中具有优先参考效力。建议用户在交易过程中保留重要沟通记录的截图。</p>
                <p><strong>9.4 法律途径：</strong>如调解无法解决争议，双方可向有管辖权的人民法院提起诉讼，或向约定的仲裁机构申请仲裁。</p>
                <p><strong>9.5 适用法律：</strong>本协议的订立、解释、履行及争议解决均适用中华人民共和国法律（不含港澳台地区法律）。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">十、平台的权利与义务</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p><strong>10.1 平台承诺：</strong></p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>中立撮合交易，不偏袒任何一方；</li>
                  <li>保障资金托管安全，专款专用；</li>
                  <li>公平、公正处理纠纷申诉；</li>
                  <li>保护用户个人信息安全（见隐私政策）；</li>
                  <li>不干预合法交易，不向买卖双方收取额外费用。</li>
                </ul>
                <p><strong>10.2 平台权利：</strong></p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>对违反本协议的用户采取暂停或终止措施；</li>
                  <li>在不降低服务水平的前提下，随时修改或终止部分服务功能；</li>
                  <li>审查可疑交易，必要时暂停相关款项处理；</li>
                  <li>根据法律要求配合执法机关调查。</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">十一、责任限制</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>在法律允许的最大范围内：</p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li>平台仅作为信息中介，不对用户发布的域名信息的准确性、完整性承担担保责任；</li>
                  <li>平台不对因买卖双方违约、欺诈行为导致的损失承担连带责任，但在托管资金保障范围内承担有限责任；</li>
                  <li>平台对不可抗力事件（自然灾害、政府监管、网络中断等）导致的服务中断不承担责任；</li>
                  <li>本平台对任何单一事件的赔偿上限不超过该交易中平台实际收取的服务费金额。</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">十二、协议的修改与终止</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p><strong>12.1 修改：</strong>本平台有权根据法律法规变化及业务发展需要修改本协议。修改后的协议将在平台发布公告，公告后 7 日内为异议期，如您不接受修改，可申请注销账户。逾期未提出异议并继续使用服务，视为接受修改后的协议。</p>
                <p><strong>12.2 终止：</strong>本协议在您注销账户或被平台终止服务时终止。协议终止不影响终止前已产生的权利义务，尤其是交易争议处理、未结算资金等事项。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">十三、联系与反馈</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
                <p>如您对本协议有任何疑问，欢迎通过以下方式联系我们：</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>在线工单：<a href="/contact" className="text-primary underline">联系我们</a>页面</li>
                  <li>客服邮箱：support@nic.rw</li>
                  <li>工作时间：周一至周五 09:00–18:00（UTC+8）</li>
                </ul>
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </div>
  );
};

export default TermsPage;
