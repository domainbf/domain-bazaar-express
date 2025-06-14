
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const ContactPage = () => {
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
            <CardTitle className="text-3xl font-bold text-center">联系我们</CardTitle>
          </CardHeader>
          <CardContent className="mt-6 text-lg text-center space-y-8">
            <p className="text-gray-600">
              如果您有任何问题或需要支持，请随时通过以下方式与我们联系。
            </p>
            <div className="flex flex-col md:flex-row justify-center items-center gap-8">
              <div className="flex items-center gap-3">
                <Mail className="h-6 w-6 text-primary" />
                <a href="mailto:support@example.com" className="hover:underline">
                  support@example.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-6 w-6 text-primary" />
                <span>+86 400-123-4567</span>
              </div>
            </div>
            <p className="text-gray-600">我们的工作时间是周一至周五，上午9点至下午6点。</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
