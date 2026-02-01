import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Domain } from '@/types/domain';

interface HorizontalDomainCarouselProps {
  domains: Domain[];
  direction?: 'ltr' | 'rtl'; // ltr: left to right (推荐), rtl: right to left (精品)
  title?: string;
  showAutoScroll?: boolean;
}

export const HorizontalDomainCarousel = ({
  domains,
  direction = 'ltr',
  title = '推荐域名',
  showAutoScroll = true
}: HorizontalDomainCarouselProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [domains]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320; // 一个卡片的宽度 + gap
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 300);
    }
  };

  if (domains.length === 0) return null;

  return (
    <div className="w-full px-4 md:px-0">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
          {title}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="h-10 w-10 rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="h-10 w-10 rounded-full"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 滚动容器 */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth"
        style={{
          scrollBehavior: 'smooth',
          direction: direction === 'rtl' ? 'rtl' : 'ltr'
        }}
      >
        {domains.map((domain) => (
          <div
            key={domain.id}
            className="flex-shrink-0 w-80 snap-center"
            style={{
              direction: 'ltr'
            }}
          >
            {/* 域名卡片 */}
            <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 h-full flex flex-col">
              {/* 顶部装饰 */}
              <div className="h-2 bg-gradient-to-r from-yellow-400 to-orange-400"></div>

              {/* 卡片内容 */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                {/* 域名名称 - 大字体 */}
                <div>
                  <div className="mb-4 text-center">
                    <h4 className="text-4xl md:text-5xl font-bold text-gray-900 break-words line-clamp-3">
                      {domain.name}
                    </h4>
                  </div>

                  {/* 分类标签 */}
                  {domain.category && (
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                        {domain.category}
                      </span>
                    </div>
                  )}

                  {/* 描述 */}
                  {domain.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {domain.description}
                    </p>
                  )}
                </div>

                {/* 价格和操作按钮 */}
                <div className="space-y-3 border-t pt-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">起价</p>
                    <p className="text-3xl font-bold text-gray-900">
                      ¥{(domain.price || 0).toLocaleString()}
                    </p>
                  </div>

                  {/* 按钮组 */}
                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-semibold transition-colors">
                      详情
                    </button>
                    <button className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors">
                      报价
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
