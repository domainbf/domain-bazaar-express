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
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">免责声明</h1>
          </div>
          <p className="text-muted-foreground text-sm">最后更新日期：2025年1月1日</p>
        </div>

        {customContent ? (
          <CustomContent text={customContent} />
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">一、信息准确性</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>本平台上展示的域名信息（包括域名价值评估、历史交易数据、流量数据等）由卖家或第三方数据服务提供，本平台不对上述信息的准确性、完整性或时效性作出保证。</p>
                <p>用户在做出购买决策前，应自行对域名进行尽职调查，包括但不限于验证域名所有权、商标状态、历史使用情况等。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">二、交易风险</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>2.1 域名交易存在固有风险，包括但不限于域名价值波动、商标纠纷、技术故障等。本平台不对因上述原因导致的损失承担责任。</p>
                <p>2.2 本平台提供资金托管服务以降低交易风险，但不对域名本身的商业价值或域名转移后的收益作任何保证。</p>
                <p>2.3 因买卖双方违约、欺诈或其他非本平台过错原因导致的交易纠纷，本平台将尽力协调处理，但不承担连带责任。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">三、第三方链接</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>本平台可能包含指向第三方网站或服务的链接。这些链接仅为方便用户提供，本平台不对第三方网站的内容、隐私政策或服务质量负责。访问第三方网站所产生的风险由用户自行承担。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">四、服务中断</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>本平台将尽力保持服务的持续稳定运行，但不对因以下原因导致的服务中断承担责任：</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>不可抗力事件（地震、台风、洪水、战争等）</li>
                  <li>网络服务商故障或基础设施问题</li>
                  <li>政府法规或监管要求</li>
                  <li>病毒攻击或黑客入侵</li>
                  <li>系统维护、升级或故障修复</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">五、知识产权</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>5.1 本平台上展示的域名可能涉及第三方商标权、版权或其他知识产权。本平台不保证这些域名不存在侵权风险，买家须自行评估相关法律风险。</p>
                <p>5.2 本平台的界面设计、文字内容、技术代码等均受版权保护，未经授权不得复制、修改或用于商业用途。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">六、域名估值</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>本平台提供的域名估值仅供参考，基于算法模型和历史数据生成，不代表域名的实际市场成交价格。域名的最终价值取决于市场供需、买卖双方协商等多种因素，本平台对估值结果不承担任何责任。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">七、责任限制</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>在法律允许的最大范围内，本平台对因使用或无法使用本平台服务而导致的任何直接、间接、附带、特殊或后果性损失不承担责任，即使本平台已被告知此类损失的可能性。</p>
                <p>本平台对任何单一事件的最大赔偿责任不超过该事件相关交易中本平台实际收取的服务费用。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">八、适用法律</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>本免责声明及与本平台相关的一切争议均适用文莱达鲁萨兰国法律。如有争议，双方应首先协商解决；协商不成时，提交有管辖权的法院解决。</p>
                <p>如您对本声明有任何疑问，请通过<a href="/contact" className="text-primary underline">联系我们</a>页面与我们联系。</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisclaimerPage;
