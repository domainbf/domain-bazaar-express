import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ThemeMode = "system" | "light" | "dark";

const CYCLE: ThemeMode[] = ["system", "light", "dark"];

const CONFIG: Record<ThemeMode, { icon: React.ReactNode; label: string; next: string }> = {
  system: {
    icon: <Monitor className="h-4 w-4" />,
    label: "跟随系统",
    next: "切换到亮色",
  },
  light: {
    icon: <Sun className="h-5 w-5" />,
    label: "亮色模式",
    next: "切换到暗色",
  },
  dark: {
    icon: <Moon className="h-5 w-5" />,
    label: "暗色模式",
    next: "跟随系统",
  },
};

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
        <span className="sr-only">切换主题</span>
      </Button>
    );
  }

  const current = (CYCLE.includes(theme as ThemeMode) ? theme : "system") as ThemeMode;
  const nextMode = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
  const { icon, label, next } = CONFIG[current];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(nextMode)}
            className="h-10 w-10 rounded-full hover:bg-accent transition-colors relative"
            aria-label={label}
          >
            {icon}
            {current === "system" && (
              <span
                className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary"
                title={resolvedTheme === "dark" ? "当前系统为暗色" : "当前系统为亮色"}
              />
            )}
            <span className="sr-only">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">
            <span className="font-medium">{label}</span>
            {current === "system" && (
              <span className="text-muted-foreground ml-1">
                （系统{resolvedTheme === "dark" ? "暗色" : "亮色"}）
              </span>
            )}
            <br />
            <span className="text-muted-foreground">{next} →</span>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
