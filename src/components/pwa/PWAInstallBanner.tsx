import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, ArrowDownToLine } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-banner-dismissed-v2';
const AUTO_CLOSE_MS = 5000;

export const PWAInstallBanner = () => {
  const { config } = useSiteSettings();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bannerEnabled = config.pwa_install_banner !== 'false';

  useEffect(() => {
    if (!bannerEnabled) return;
    if (localStorage.getItem(DISMISS_KEY) === 'true') return;

    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    setIsIOS(ios);

    if (ios) {
      setTimeout(() => setShowBanner(true), 2500);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 2500);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [bannerEnabled]);

  // Countdown + auto-close
  useEffect(() => {
    if (!showBanner) return;
    setCountdown(5);

    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    closeTimerRef.current = setTimeout(() => dismiss(), AUTO_CLOSE_MS);

    return () => {
      clearInterval(timerRef.current!);
      clearTimeout(closeTimerRef.current!);
    };
  }, [showBanner]);

  const dismiss = () => {
    setShowBanner(false);
    localStorage.setItem(DISMISS_KEY, 'true');
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    clearTimeout(closeTimerRef.current!);
    clearInterval(timerRef.current!);
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') dismiss();
    setInstallPrompt(null);
  };

  if (!showBanner || !bannerEnabled) return null;

  // SVG countdown ring params
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const progress = (countdown / 5) * circumference;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          key="pwa-banner"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          className="fixed bottom-20 left-3 right-3 z-50 md:left-auto md:right-5 md:w-[340px]"
        >
          <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-white/10"
            style={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)' }}>

            {/* Animated top accent bar */}
            <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400" />

            {/* Shimmer overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
                className="absolute top-0 bottom-0 w-1/3 opacity-10"
                style={{ background: 'linear-gradient(90deg, transparent, white, transparent)' }}
              />
            </div>

            <div className="relative p-4">
              <div className="flex items-start gap-3">

                {/* App icon */}
                <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                  <span className="text-white font-bold text-lg leading-none">N</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-sm font-bold text-white">把域名市场装进口袋</p>
                    <span className="text-base">📱</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {isIOS
                      ? <>点击底部 <Share className="inline h-3 w-3 mb-0.5 text-blue-400" /> 分享，选择<span className="text-blue-400 font-medium">「添加到主屏幕」</span>即可</>
                      : '一键安装，随时随地快速访问域名市场'}
                  </p>

                  {!isIOS && (
                    <button
                      onClick={handleInstall}
                      className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-80 active:scale-95"
                      style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}
                    >
                      <ArrowDownToLine className="h-3 w-3" />
                      立即安装
                    </button>
                  )}
                </div>

                {/* Right side: countdown ring + close */}
                <div className="shrink-0 flex flex-col items-center gap-2">
                  {/* SVG Countdown Ring */}
                  <div className="relative w-9 h-9">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                      <motion.circle
                        cx="18" cy="18" r={radius}
                        fill="none"
                        stroke="url(#countdown-grad)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - progress}
                        animate={{ strokeDashoffset: circumference - progress }}
                        transition={{ duration: 0.9, ease: 'linear' }}
                      />
                      <defs>
                        <linearGradient id="countdown-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white/80">
                      {countdown}
                    </span>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={dismiss}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
                    aria-label="关闭"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-0.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #3b82f6, #a855f7)' }}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: AUTO_CLOSE_MS / 1000, ease: 'linear' }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
