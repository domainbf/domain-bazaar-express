
import React from 'react';
import { useRouteError, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

interface RouteError {
  statusText?: string;
  message?: string;
  status?: number;
}

export const ErrorPage: React.FC = () => {
  const error = useRouteError() as RouteError;
  const navigate = useNavigate();

  const getErrorMessage = () => {
    if (error?.status === 404) {
      return {
        title: '页面未找到',
        description: '抱歉，您访问的页面不存在或已被移除。',
        showBackButton: true
      };
    }
    
    return {
      title: '页面加载错误',
      description: error?.statusText || error?.message || '发生了未知错误，请稍后重试。',
      showBackButton: true
    };
  };

  const { title, description, showBackButton } = getErrorMessage();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center bg-red-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild className="w-full">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Link>
          </Button>
          {showBackButton && (
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回上一页
            </Button>
          )}
          <Button 
            variant="ghost" 
            onClick={() => window.location.reload()}
            className="w-full"
          >
              刷新页面
            </Button>
        </CardContent>
      </Card>
    </div>
  );
};
