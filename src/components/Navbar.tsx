
import React from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast"
import { LogOut, Settings, User, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import logo from '/placeholder.svg';

// 新增：支持 unreadCount 传参
export const Navbar = ({ unreadCount = 0 }: { unreadCount?: number }) => {
  const { user, logOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/');
      toast({
        title: "登出成功",
        description: "您已成功登出",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "登出失败",
        description: "请稍后重试",
      })
    }
  };

  // 修改“通知”入口，带角标
  return (
    <nav className="w-full bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center font-semibold text-2xl">
          <img src={logo} alt="Logo" className="h-8 w-auto mr-2" />
          域名交易平台
        </Link>
        <div className="flex items-center space-x-2">
          {user ? (
            <TooltipProvider>
              <div className="flex items-center space-x-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="h-10 w-10 rounded-full">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>控制面板</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => navigate('/user-center')} className="h-10 w-10 rounded-full">
                      <User className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>用户中心</p></TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate('/user-center?tab=notifications')}
                      className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100"
                      title="通知"
                    >
                      <Bell className="w-5 h-5 text-gray-700" />
                      {unreadCount > 0 && (
                        <Badge className="bg-blue-500 absolute -top-1 -right-1 px-1.5 py-0 text-xs font-bold flex items-center justify-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent><p>通知</p></TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleLogout} className="h-10 w-10 rounded-full">
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>退出登录</p></TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/profile')}>登录</Button>
              <Button onClick={() => navigate('/profile')}>注册</Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
