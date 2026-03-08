import { Link } from 'react-router-dom';
import { Domain } from '@/types/domain';
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Shield, ArrowUpRight, Eye, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export interface DomainListingsProps {
  domains: Domain[];
  isLoading: boolean;
  isMobile?: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" },
  }),
};

export const DomainListings = ({ domains, isLoading, isMobile }: DomainListingsProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (domains.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-2xl font-bold text-foreground mb-2">没有找到域名</h3>
        <p className="text-muted-foreground">尝试调整筛选条件或搜索不同的关键词</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          共 <span className="font-semibold text-foreground">{domains.length}</span> 个域名
        </p>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'}`}>
        {domains.map((domain, i) => (
          <motion.div
            key={domain.id}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Link 
              to={`/domain/${encodeURIComponent(domain.name)}`}
              className="group block h-full"
            >
              <div className="relative h-full border border-border bg-card rounded-xl px-5 py-6 
                transition-all duration-300 ease-out
                hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1
                dark:hover:shadow-primary/10">
                
                {/* Highlight glow effect */}
                {domain.highlight && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                )}

                {/* Top badges */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5">
                    {domain.highlight && (
                      <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0 h-5 font-bold">
                        精选
                      </Badge>
                    )}
                    {domain.is_verified && (
                      <Badge className="bg-green-600 dark:bg-green-500 text-white text-[10px] px-2 py-0 h-5 gap-0.5">
                        <Shield className="h-2.5 w-2.5" />已验证
                      </Badge>
                    )}
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>

                {/* Domain name - hero element */}
                <h3 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight leading-none break-all
                  transition-colors duration-300 group-hover:text-primary">
                  {domain.name}
                </h3>

                {/* Price */}
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-lg font-bold text-foreground">
                    ${domain.price?.toLocaleString()}
                  </span>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                  {domain.category && (
                    <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {domain.category}
                    </span>
                  )}
                  {domain.views !== undefined && domain.views > 0 && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Eye className="h-3 w-3" />{domain.views}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
