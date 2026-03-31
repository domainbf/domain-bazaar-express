import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from 'lucide-react';
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

const DisclaimerPage = () => {
  const { config } = useSiteSettings();
  const customContent = config.legal_disclaimer_content?.trim();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl mx-auto px-4 py-8 pb-24">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">免责声明</h1>
          </div>
          <p className="text-muted-foreground text-sm">最后更新日期：2025年3月1日 &nbsp;|&nbsp; 生效日期：2025年3月15日</p>
          <p className="text-muted-foreground text-sm mt-1">请在使用本平台服务前认真阅读本免责声明，本声明与《用户服务协议》具有同等法律效力。</p>
        </div>

        {customContent ? (
          <CustomContent text={customContent} />
        ) : (
          <div className="space-y-6">

            <Card>
              <CardHeader><CardTitle className="text-lg">一、平台定位与中介性质声明</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>域见·你（NIC.RW）是一家域名交易撮合平台，仅提供信息发布、交易撮合、资金托管等中介服务。平台本身不是域名的买方或卖方，所有交易合同关系存在于买卖双方之间，与平台无关。</p>
                <p>本平台不对任何用户或第三方发布的域名信息（包括但不限于描述文字、价值评估、流量数据、历史记录）的真实性、准确性、完整性或合法性作出任何明示或暗示的保证。</p>
                <p>使用本平台服务即表示您理解并接受本免责声明所述的全部风险。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">二、域名信息准确性免责</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>2.1 <strong>卖家自行发布内容：</strong>域名描述、分类、价格、历史等信息由卖家自行填写，平台不对内容的准确性承担核实义务或连带责任。</p>
                <p>2.2 <strong>第三方数据引用：</strong>平台可能展示来自第三方数据服务（WHOIS 查询、流量统计、关键词数据等）的信息，这些信息仅供参考，可能存在滞后、不准确等情况，平台不对其完整性或时效性负责。</p>
                <p>2.3 <strong>历史数据局限性：</strong>域名历史成交价格、流量趋势等数据不代表未来表现，不应作为投资决策的唯一依据。</p>
                <p>2.4 <strong>买家尽职调查义务：</strong>买家在作出购买决策前，应自行进行尽职调查，包括但不限于：核实 WHOIS 所有权信息、查询商标数据库、检查域名是否存在搜索引擎惩罚、确认域名可正常转移状态等。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">三、交易风险提示</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>域名投资及交易存在固有风险，请充分评估后谨慎决策：</p>
                <ul className="list-disc list-inside space-y-2 pl-2">
                  <li><strong>价值不确定性：</strong>域名市场价格受多种因素影响，历史成交价和平台估值均不代表当前市场价值，域名价格可能大幅波动。</li>
                  <li><strong>商标与法律风险：</strong>购买某些域名可能涉及他人商标权，买家须自行评估并承担相关法律风险。平台不提供任何法律意见，建议咨询专业律师。</li>
                  <li><strong>技术风险：</strong>域名转移过程存在技术障碍的可能性，注册局故障、注册商政策变更等均可能导致转移延迟，平台将尽力协助但不对此类延迟承担责任。</li>
                  <li><strong>欺诈风险：</strong>尽管平台采取多项安全措施，仍无法完全杜绝欺诈行为。强烈建议通过平台托管完成交易，不要接受平台外的付款请求。</li>
                  <li><strong>汇率风险：</strong>跨境交易涉及货币兑换，汇率波动可能影响实际收付金额，平台不对此承担任何损失。</li>
                  <li><strong>监管风险：</strong>域名相关法规因国家和地区不同而存在差异，跨境交易可能受不同司法管辖区法律约束，用户须自行了解并遵守适用法律。</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">四、域名估值免责</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>本平台提供的域名估值工具（以下简称"估值系统"）基于算法模型，综合参考历史成交数据、域名属性、关键词价值等多维度因素自动计算结果。</p>
                <p>关于估值的重要说明：</p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li>估值结果<strong>仅供参考</strong>，不代表域名的实际市场成交价格；</li>
                  <li>算法模型存在局限性，无法预测特殊买家的主观价值判断；</li>
                  <li>短域名、品牌域名、词汇域名等特殊类型的实际成交价可能与估值存在较大偏差；</li>
                  <li>本平台不对因依赖估值结果而作出的任何决策所产生的损失承担任何责任；</li>
                  <li>投资者不应将域名估值作为财务投资建议，域名市场具有高度主观性和不确定性。</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">五、服务可用性与中断免责</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>本平台致力于提供稳定、持续的服务，但不对以下原因导致的服务中断或数据丢失承担责任：</p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li><strong>不可抗力：</strong>自然灾害（地震、台风、洪水）、战争、政府管控等；</li>
                  <li><strong>基础设施故障：</strong>互联网运营商故障、云服务商故障、DNS 劫持等；</li>
                  <li><strong>网络攻击：</strong>DDoS 攻击、黑客入侵、病毒感染等恶意行为；</li>
                  <li><strong>监管要求：</strong>政府部门依法要求暂停或关闭服务；</li>
                  <li><strong>计划维护：</strong>系统升级、数据库维护、安全补丁部署（通常提前公告）；</li>
                  <li><strong>第三方服务中断：</strong>支付渠道、域名注册商、邮件服务等第三方合作方的故障。</li>
                </ul>
                <p>在计划维护期间，平台将提前在首页公告，尽量减少对用户的影响。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">六、第三方链接与服务免责</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>6.1 本平台可能包含指向第三方网站（如域名注册商、支付平台、WHOIS 查询工具等）的链接，仅为方便用户使用。我们不对第三方网站的内容、隐私政策、安全性或服务质量承担任何责任。</p>
                <p>6.2 第三方服务的使用受其各自服务条款约束，由用户与第三方直接建立服务关系，平台不介入。</p>
                <p>6.3 汇率转换数据来源于第三方金融数据服务，仅供参考，不构成金融投资建议。实际汇率以银行或支付渠道实时汇率为准。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">七、知识产权风险提示</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>7.1 平台上展示的域名可能与已注册的商标、品牌名称或其他知识产权存在相似性。平台不对域名是否侵犯任何商标权、著作权或其他知识产权作出保证。</p>
                <p>7.2 买家在购买域名前应自行查询相关商标数据库（如中国商标局、USPTO、EUIPO 等），评估域名的法律风险，并在必要时咨询知识产权律师。</p>
                <p>7.3 如因购买侵权域名产生的任何法律纠纷、损失或赔偿，由买卖双方自行承担，与平台无关（但平台在调解中保持中立协助）。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">八、投资风险特别声明</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p><strong>特别提示：域名不是法定投资产品，不受金融监管机构的保护。</strong></p>
                <p>域名投资具有以下风险特征，请充分了解后谨慎决策：</p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li>市场流动性不稳定，某些域名可能长期找不到买家；</li>
                  <li>域名价值高度主观，受互联网行业趋势、品牌动态影响显著；</li>
                  <li>域名续费成本是持有成本的一部分，需每年缴纳注册费；</li>
                  <li>域名注册局政策变化可能影响某些后缀的使用价值；</li>
                  <li>大量囤积特定组合的域名可能面临抢注投机的法律风险。</li>
                </ul>
                <p>平台不提供任何形式的财务、税务或投资建议，以上信息均不构成建议。如需专业意见，请咨询相关专业人士。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">九、总体责任限制</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>在法律允许的最大范围内，本平台对因以下原因导致的任何直接、间接、附带、特殊、惩罚性或后果性损失不承担赔偿责任：</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>依赖平台信息或估值结果作出的商业决策；</li>
                  <li>第三方欺诈或违约行为（在托管范围外）；</li>
                  <li>域名市场价值的波动与变化；</li>
                  <li>无法预期或不可控的技术故障；</li>
                  <li>用户违反本协议或法律规定导致的损失。</li>
                </ul>
                <p>即使本平台已被告知上述损失发生的可能性，上述免责条款仍然适用。本平台对任何单一事件的最大赔偿责任，以平台因该事件从您处实际收取的服务费为上限。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">十、适用法律与争议解决</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>本免责声明及与本平台相关的一切争议，首先适用中华人民共和国法律。如涉及跨境交易的特定事项，以相关司法管辖区法律为准。</p>
                <p>争议解决顺序：友好协商 → 平台调解 → 司法诉讼/仲裁。</p>
                <p>如您对本声明有任何疑问或异议，请通过<a href="/contact" className="text-primary underline">联系我们</a>页面与我们取得联系，我们将认真对待您的每一条反馈。</p>
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </div>
  );
};

export default DisclaimerPage;
