import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { motion } from 'framer-motion';
import { DomainScrollBands } from './DomainScrollBands';

const ENTER = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };

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
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/4 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto text-center">
        <motion.h1
          variants={ENTER}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-foreground leading-tight"
        >
          {config.hero_title}
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
            <Input
              type="text"
              placeholder={config.hero_search_placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 h-11 md:h-12 text-base md:text-lg px-4 md:px-6 border-border transition-shadow duration-200 focus:shadow-md"
              data-testid="input-hero-search"
            />
            <Button
              onClick={handleSearch}
              className="h-11 md:h-12 px-6 md:px-8 bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap transition-all active:scale-[0.97]"
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
