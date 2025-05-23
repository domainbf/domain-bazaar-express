
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { changeLanguage } from "@/i18n";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LanguageSwitcherProps {
  className?: string;
  iconOnly?: boolean;
}

export const LanguageSwitcher = ({ className = "", iconOnly = false }: LanguageSwitcherProps) => {
  const { i18n, t } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);
  
  const handleLanguageChange = async (lang: string) => {
    if (lang === i18n.language) return;
    
    setIsChanging(true);
    try {
      toast.loading(t('common.changingLanguage', 'Changing language...'));
      await changeLanguage(lang);
      
      // Use a slight delay before reload to allow the toast to be visible
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Failed to change language:", error);
      toast.error(t('common.languageChangeFailed', 'Failed to change language'));
      setIsChanging(false);
    }
  };

  if (iconOnly) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full p-2 ${className}`}
            disabled={isChanging}
          >
            <Globe className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white">
          <DropdownMenuItem onClick={() => handleLanguageChange('zh')}>
            中文
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
            English
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center gap-1 px-2 ${className}`}
          disabled={isChanging}
        >
          <Globe className="h-4 w-4" />
          <span className="text-sm">
            {i18n.language === 'en' ? 'English' : '中文'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white">
        <DropdownMenuItem onClick={() => handleLanguageChange('zh')}>
          中文
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
