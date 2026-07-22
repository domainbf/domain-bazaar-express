import { ShieldCheck, Lock, RefreshCw, HeadphonesIcon } from 'lucide-react';

const ITEMS = [
  { icon: ShieldCheck, title: '资金托管', desc: '第三方托管，交易安全' },
  { icon: Lock, title: 'SSL 加密', desc: '全链路加密支付' },
  { icon: RefreshCw, title: '30 天保障', desc: '未过户可全额退款' },
  { icon: HeadphonesIcon, title: '专属客服', desc: '24×7 中文支持' },
];

export const SecurityStrip = () => (
  <div className="rounded-2xl border border-border bg-card/50 p-4 md:p-5 mb-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {ITEMS.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="flex items-center gap-3">
          <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
            <Icon className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{title}</div>
            <div className="text-[11px] text-muted-foreground truncate">{desc}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
