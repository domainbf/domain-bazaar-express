
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { changeLanguage } from "@/i18n";

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher = ({ className = "" }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();
  
  const toggleLanguage = () => {
    const newLanguage = i18n.language === 'en' ? 'zh' : 'en';
    changeLanguage(newLanguage);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className={`flex items-center gap-1 px-2 ${className}`}
      title={i18n.language === 'en' ? '切换到中文' : 'Switch to English'}
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm">{i18n.language === 'en' ? '中文' : 'EN'}</span>
    </Button>
  );
};
