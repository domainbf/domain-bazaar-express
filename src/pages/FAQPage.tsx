
import { Navbar } from "@/components/Navbar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const faqs = [
  {
    question: "如何购买域名？",
    answer:
      "在域名市场页面浏览或搜索您感兴趣的域名，点击进入详情页，您可以选择“立即购买”或“提交报价”。按照流程完成支付即可。",
  },
  {
    question: "如何出售我的域名？",
    answer:
      "登录后，在用户中心的“我的域名”页面，点击“添加域名”按钮，填写相关信息并设置价格。为了提高可信度，建议您完成域名验证。",
  },
  {
    question: "什么是域名验证？",
    answer:
      "域名验证是确认您对该域名拥有所有权的过程。通过验证的域名会有特殊标识，更容易获得买家信任。您可以在域名管理页面发起验证。",
  },
  {
    question: "交易安全吗？",
    answer:
      "我们提供安全的交易流程，并建议使用第三方托管服务来确保买卖双方的资金和域名安全。所有交易记录都可以在用户中心查看。",
  },
];

export const FAQPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end mb-4">
          <Button asChild variant="outline">
            <Link to="/user-center">返回用户中心</Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">常见问题</CardTitle>
          </CardHeader>
          <CardContent className="mt-6">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="text-lg text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-base text-gray-700">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
