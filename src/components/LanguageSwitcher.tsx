
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
      const loadingToast = toast.loading(t('common.changingLanguage', 'Changing language...'));
      await changeLanguage(lang);
      
      // Dismiss the loading toast
      toast.dismiss(loadingToast);
      
      // Show success message
      toast.success(t('common.success', 'Success'), { duration: 1500 });
    } catch (error) {
      console.error("Failed to change language:", error);
      toast.error(t('common.languageChangeFailed', 'Failed to change language'));
    } finally {
      setIsChanging(false);
    }
  };

  const getLanguageDisplay = (langCode: string) => {
    const languageMap = {
      'zh': '中文',
      'en': 'English'
    };
    return languageMap[langCode as keyof typeof languageMap] || langCode;
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
          <DropdownMenuItem 
            onClick={() => handleLanguageChange('zh')}
            className={i18n.language === 'zh' ? 'bg-gray-100' : ''}
          >
            中文
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleLanguageChange('en')}
            className={i18n.language === 'en' ? 'bg-gray-100' : ''}
          >
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
            {getLanguageDisplay(i18n.language)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white">
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('zh')}
          className={i18n.language === 'zh' ? 'bg-gray-100' : ''}
        >
          中文
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('en')}
          className={i18n.language === 'en' ? 'bg-gray-100' : ''}
        >
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
