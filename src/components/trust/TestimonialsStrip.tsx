import { Star, Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: '李先生',
    role: '科技公司创始人',
    text: '交易过程非常顺畅，托管服务让我完全放心，24 小时内完成过户。',
    rating: 5,
  },
  {
    name: '王女士',
    role: '品牌顾问',
    text: '价格透明，没有隐藏费用，客服响应速度非常快。',
    rating: 5,
  },
  {
    name: 'Chen',
    role: '独立开发者',
    text: 'AI 估价很有参考价值，最终成交价高于我的预期。',
    rating: 5,
  },
  {
    name: '张先生',
    role: '投资人',
    text: '批量管理和后台报表非常专业，推荐给同行。',
    rating: 5,
  },
];

export const TestimonialsStrip = () => {
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">用户口碑</h2>
          <p className="text-sm text-muted-foreground mt-2">来自真实买家与卖家的评价</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="relative rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors"
            >
              <Quote className="absolute top-4 right-4 w-5 h-5 text-primary/20" />
              <div className="flex items-center gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed mb-4">"{t.text}"</p>
              <div className="pt-3 border-t border-border">
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
