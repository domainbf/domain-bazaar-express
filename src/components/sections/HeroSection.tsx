import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';

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
    <section className="relative pt-12 md:pt-20 pb-10 md:pb-16 px-4 bg-background">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-foreground leading-tight">
          {config.hero_title}
        </h1>
        
        <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 md:mb-8 px-2">
          {config.hero_subtitle}
        </p>

        <div className="max-w-2xl mx-auto mb-8 md:mb-12">
          <div className="relative flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              placeholder={config.hero_search_placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 h-11 md:h-12 text-base md:text-lg px-4 md:px-6 border-border"
            />
            <Button 
              onClick={handleSearch}
              className="h-11 md:h-12 px-6 md:px-8 bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap"
            >
              <Search className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              搜索
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-2">
          <Button 
            onClick={() => navigate('/marketplace')}
            className="px-6 md:px-8 py-2.5 md:py-3 text-base md:text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {config.hero_cta_primary}
          </Button>
          <Button 
            onClick={() => navigate('/auth')}
            variant="outline" 
            className="px-6 md:px-8 py-2.5 md:py-3 text-base md:text-lg border-border text-foreground hover:bg-accent"
          >
            {config.hero_cta_secondary}
          </Button>
        </div>
      </div>
    </section>
  );
};
