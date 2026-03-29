import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallBanner = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('pwa-install-dismissed') === 'true') return;

    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone) return;

    setIsIOS(ios);

    if (ios) {
      setTimeout(() => setShowBanner(true), 3000);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (dismissed || !showBanner) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:w-80"
        >
          <div className="bg-card border border-border shadow-xl rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-lg p-2 mt-0.5 shrink-0">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">安装域见•你 App</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isIOS
                    ? '点击底部分享按钮，再选择"添加到主屏幕"即可安装'
                    : '安装到桌面，随时快速访问域名市场'}
                </p>
                {!isIOS && (
                  <Button
                    size="sm"
                    onClick={handleInstall}
                    className="mt-3 h-8 text-xs gap-1.5"
                    data-testid="button-pwa-install"
                  >
                    <Download className="h-3.5 w-3.5" />
                    立即安装
                  </Button>
                )}
              </div>
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
                data-testid="button-pwa-dismiss"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
