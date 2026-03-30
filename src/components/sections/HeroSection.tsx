import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { motion } from 'framer-motion';
import { DomainScrollBands } from './DomainScrollBands';

const ENTER = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };

const PARTICLES = [
  { size: 5, top: '18%', left: '12%', delay: '0s', duration: '7s' },
  { size: 3, top: '35%', left: '88%', delay: '1.2s', duration: '9s' },
  { size: 4, top: '72%', left: '7%',  delay: '2.1s', duration: '8s' },
  { size: 6, top: '55%', left: '78%', delay: '0.5s', duration: '11s' },
  { size: 3, top: '82%', left: '55%', delay: '3s',   duration: '7.5s' },
  { size: 4, top: '12%', left: '65%', delay: '1.8s', duration: '10s' },
  { size: 2, top: '45%', left: '42%', delay: '4s',   duration: '6.5s' },
];

export const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { config } = useSiteSettings();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/marketplace');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <section className="relative pt-12 md:pt-20 pb-10 md:pb-16 px-4 bg-background overflow-hidden">

      {/* ── Subtle dark overlay only ── */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">

        {/* subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* floating particles */}
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-particle"
            style={{
              width: p.size,
              height: p.size,
              top: p.top,
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
              background: i % 3 === 0
                ? 'rgba(99,102,241,0.5)'
                : i % 3 === 1
                  ? 'rgba(6,182,212,0.45)'
                  : 'rgba(139,92,246,0.4)',
            }}
          />
        ))}
      </div>

      <div className="relative max-w-6xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          variants={ENTER}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-border bg-card/50 dark:bg-white/5 text-muted-foreground text-sm font-medium"
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-foreground/50 animate-pulse" />
          专业域名交易平台
        </motion.div>

        <motion.h1
          variants={ENTER}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight"
        >
          <span className="text-foreground">{config.hero_title || '寻找完美的域名'}</span>
        </motion.h1>

        <motion.p
          variants={ENTER}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 md:mb-8 px-2"
        >
          {config.hero_subtitle}
        </motion.p>

        <motion.div
          variants={ENTER}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="max-w-2xl mx-auto mb-8 md:mb-12"
        >
          <div className="relative flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder={config.hero_search_placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="h-11 md:h-12 text-base md:text-lg px-4 md:px-6 pr-4 border-border transition-shadow duration-200 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.2)] focus:border-indigo-400 dark:focus:border-indigo-600"
                data-testid="input-hero-search"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="h-11 md:h-12 px-6 md:px-8 whitespace-nowrap transition-all active:scale-[0.97] bg-foreground text-background hover:bg-foreground/90 border-0 shadow-md hover:shadow-lg"
              data-testid="button-hero-search"
            >
              <Search className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              搜索
            </Button>
          </div>
        </motion.div>

        <DomainScrollBands />

        <motion.div
          variants={ENTER}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="flex flex-row gap-3 md:gap-4 justify-center px-2"
        >
          <Button
            onClick={() => navigate('/marketplace')}
            className="flex-1 max-w-[180px] px-4 md:px-8 py-2.5 md:py-3 text-sm md:text-base bg-primary hover:bg-primary/90 text-primary-foreground transition-all active:scale-[0.97]"
            data-testid="button-hero-browse"
          >
            {config.hero_cta_primary}
          </Button>
          <Button
            onClick={() => navigate('/sell')}
            variant="outline"
            className="flex-1 max-w-[180px] px-4 md:px-8 py-2.5 md:py-3 text-sm md:text-base border-border text-foreground hover:bg-accent transition-all active:scale-[0.97]"
            data-testid="button-hero-sell"
          >
            {config.hero_cta_secondary}
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
