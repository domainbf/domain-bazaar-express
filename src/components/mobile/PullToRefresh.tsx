import { useState, useRef, useCallback, ReactNode } from 'react';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export const PullToRefresh = ({ 
  onRefresh, 
  children, 
  disabled = false,
  className = ''
}: PullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const maxPullDistance = 100;
  const triggerDistance = 70;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing || startY.current === 0) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    if (distance > 0 && containerRef.current?.scrollTop === 0) {
      e.preventDefault();
      const dampedDistance = Math.min(distance * 0.5, maxPullDistance);
      setPullDistance(dampedDistance);
      setShowHint(dampedDistance >= triggerDistance);
    }
  }, [disabled, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;

    if (pullDistance >= triggerDistance) {
      setIsRefreshing(true);
      setPullDistance(50); // Keep a small distance while refreshing
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
    setShowHint(false);
    startY.current = 0;
  }, [disabled, isRefreshing, pullDistance, onRefresh]);

  const refreshProgress = Math.min(pullDistance / triggerDistance, 1);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-y-auto h-full touch-pan-y ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: refreshProgress, 
              height: pullDistance || (isRefreshing ? 50 : 0)
            }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-transparent z-10"
          >
            <motion.div
              animate={{
                rotate: isRefreshing ? 360 : refreshProgress * 180,
                scale: showHint ? 1.1 : 1
              }}
              transition={{
                rotate: isRefreshing ? { repeat: Infinity, duration: 1, ease: 'linear' } : { duration: 0.1 }
              }}
            >
              <RefreshCw 
                className={`w-6 h-6 ${showHint ? 'text-primary' : 'text-muted-foreground'}`}
              />
            </motion.div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: pullDistance > 20 ? 1 : 0 }}
              className="text-xs text-muted-foreground mt-1"
            >
              {isRefreshing ? '正在刷新...' : showHint ? '释放刷新' : '下拉刷新'}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <motion.div
        animate={{
          y: pullDistance > 0 ? pullDistance : 0
        }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 400
        }}
      >
        {children}
      </motion.div>

      {/* Scroll hint */}
      {!pullDistance && !isRefreshing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 text-xs text-muted-foreground pointer-events-none"
        >
          <ChevronDown className="w-3 h-3 animate-bounce" />
          <span>下拉刷新</span>
        </motion.div>
      )}
    </div>
  );
};
