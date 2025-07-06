
// 性能监控工具
export const performance = {
  // 测量页面加载时间
  measurePageLoad: () => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigationTiming = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.domContentLoadedEventStart,
        loadComplete: navigationTiming.loadEventEnd - navigationTiming.loadEventStart,
        totalTime: navigationTiming.loadEventEnd - navigationTiming.fetchStart
      };
    }
    return null;
  },

  // 测量组件渲染时间
  measureRender: (componentName: string, renderFn: () => void) => {
    const start = Date.now();
    renderFn();
    const end = Date.now();
    console.log(`${componentName} render time:`, end - start, 'ms');
  },

  // 预加载关键资源
  preloadResource: (url: string, type: 'script' | 'style' | 'image' = 'script') => {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = type;
      document.head.appendChild(link);
    }
  },

  // 延迟加载非关键资源
  lazyLoad: (element: HTMLElement, callback: () => void) => {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            callback();
            observer.unobserve(element);
          }
        });
      });
      observer.observe(element);
    } else {
      // 降级处理
      callback();
    }
  }
};
