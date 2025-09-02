import React from "react";

interface SplashScreenProps {
  title?: string;
  subtitle?: string;
  variant?: "boot" | "page";
}

// 美观的全屏加载动效，使用设计系统语义色
export const SplashScreen: React.FC<SplashScreenProps> = ({
  title = "正在启动",
  subtitle = "正在加载...",
  variant = "boot",
}) => {
  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center">
      <div className="text-center">
        {/* 简洁的品牌标识 */}
        <div className="mb-8">
          <span className="text-3xl font-bold text-foreground">
            NIC.BN
          </span>
          <span className="ml-2 px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">Beta</span>
          <p className="mt-2 text-sm text-muted-foreground">域名交易与评估平台</p>
        </div>

        {/* 简化的加载动画 */}
        <div className="relative mx-auto mb-6 h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-foreground">NB</span>
          </div>
        </div>

        {/* 简化的标题 */}
        <h3 className="text-lg font-medium text-foreground mb-1">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {subtitle}
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
