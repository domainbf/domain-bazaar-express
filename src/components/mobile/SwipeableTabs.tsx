import React, { useState, useRef, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface SwipeableTabsProps {
  tabs: {
    key: string;
    label: string;
    icon?: ReactNode;
    badge?: number;
  }[];
  activeTab: string;
  onTabChange: (key: string) => void;
  children: ReactNode[];
  className?: string;
}

export const SwipeableTabs = ({
  tabs,
  activeTab,
  onTabChange,
  children,
  className = ''
}: SwipeableTabsProps) => {
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeIndex = tabs.findIndex(tab => tab.key === activeTab);

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (Math.abs(velocity) > 500 || Math.abs(offset) > threshold) {
      if (velocity > 0 || offset > threshold) {
        // Swipe right - go to previous tab
        if (activeIndex > 0) {
          setDirection(-1);
          onTabChange(tabs[activeIndex - 1].key);
        }
      } else {
        // Swipe left - go to next tab
        if (activeIndex < tabs.length - 1) {
          setDirection(1);
          onTabChange(tabs[activeIndex + 1].key);
        }
      }
    }
  }, [activeIndex, tabs, onTabChange]);

  const handleTabClick = (key: string) => {
    const newIndex = tabs.findIndex(tab => tab.key === key);
    setDirection(newIndex > activeIndex ? 1 : -1);
    onTabChange(key);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-white overflow-x-auto scrollbar-hide">
        {tabs.map((tab, index) => (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab.key)}
            className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium transition-all relative
              ${activeTab === tab.key 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {tab.icon && (
              <div className="relative">
                {tab.icon}
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-2 -right-2 h-4 min-w-[16px] flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground rounded-full px-1">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
            )}
            <span className="truncate w-full text-center">{tab.label}</span>
            {activeTab === tab.key && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab indicator dots */}
      <div className="flex justify-center gap-1.5 py-2 bg-gray-50">
        {tabs.map((tab, index) => (
          <div
            key={tab.key}
            className={`h-1.5 rounded-full transition-all ${
              activeTab === tab.key 
                ? 'w-4 bg-primary' 
                : 'w-1.5 bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Swipeable content */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 overflow-y-auto"
          >
            {children[activeIndex]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Swipe hint */}
      <div className="text-center py-2 text-xs text-muted-foreground bg-gray-50">
        ← 左右滑动切换标签 →
      </div>
    </div>
  );
};
