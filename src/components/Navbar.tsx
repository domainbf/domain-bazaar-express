
import React from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast"
import { LogOut, Settings, User, Home, Plus, ClipboardList, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import logo from '/placeholder.svg';

// 新增：支持 unreadCount 传参
export const Navbar = ({ unreadCount = 0 }: { unreadCount?: number }) => {
  const { user, profile, logOut } = useAuth();
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || user?.email || "头像"} />
                    <AvatarFallback>{profile?.full_name?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>我的账户</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate('/user-center?tab=profile')}>
                  <User className="mr-2 h-4 w-4" />
                  个人资料
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/user-center?tab=domains')}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  我的域名
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  <Settings className="mr-2 h-4 w-4" />
                  控制面板
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/profile')}>登录</Button>
              <Button onClick={() => navigate('/profile')}>注册</Button>
            </>
          )}
          <div className="relative">
            <button
              onClick={() => user && navigate('/user-center?tab=notifications')}
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
          </div>
        </div>
      </div>
    </nav>
  );
};
