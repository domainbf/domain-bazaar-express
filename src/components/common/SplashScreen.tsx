import React from "react";

interface SplashScreenProps {
  title?: string;
  subtitle?: string;
  variant?: "boot" | "page";
}

// 美观的全屏加载动效，使用设计系统语义色
export const SplashScreen: React.FC<SplashScreenProps> = ({
  title = "正在加载",
  subtitle = "请稍候...",
  variant = "boot",
}) => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
      <div className="w-full max-w-md px-6 text-center animate-enter">
        {/* 品牌标识 */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center gap-2">
            <span className="text-3xl font-extrabold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              NIC.BN
            </span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">Beta</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">域名交易与评估平台</p>
        </div>

        {/* Logo 旋转能量环，中心嵌入品牌首字母 */}
        <div className="relative mx-auto mb-8 h-24 w-24">
          {/* 外圈淡色轮廓 */}
          <div className="absolute inset-0 rounded-full border-4 border-muted-foreground/10" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" style={{ animationDuration: variant === 'boot' ? '1.2s' : '1s' }} />
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-secondary animate-spin" style={{ animationDuration: variant === 'boot' ? '0.9s' : '0.8s', animationDirection: 'reverse' }} />
          {/* 中心品牌字母 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold tracking-widest text-foreground">NB</span>
          </div>
          {/* 中心发光点 */}
          <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_30px_hsl(var(--primary)/.6)]" />
        </div>

        {/* 标题与副标题 */}
        <h3 className="text-xl font-semibold text-foreground tracking-tight mb-2">
          {title}
        </h3>
        <p className="text-muted-foreground">
          {subtitle}
        </p>

        {/* 进度指示条（柔和脉冲） */}
        <div className="mt-6 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-primary/70 via-secondary/70 to-primary/70 animate-pulse" />
        </div>

        {/* 呼吸色点 */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-primary pulse" />
          <span className="h-2.5 w-2.5 rounded-full bg-secondary pulse" style={{ animationDelay: '150ms' }} />
          <span className="h-2.5 w-2.5 rounded-full bg-accent pulse" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
