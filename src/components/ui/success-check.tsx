import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SuccessCheckProps {
  size?: number;
  className?: string;
  label?: string;
}

/**
 * Animated circular checkmark for success confirmations
 * (payment success, offer accepted, verification passed, etc.).
 * Uses SVG stroke-dasharray drawing for a premium reveal.
 */
export const SuccessCheck = ({ size = 72, className, label }: SuccessCheckProps) => (
  <div className={cn('inline-flex flex-col items-center gap-2', className)}>
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      className="text-emerald-500"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
    >
      <motion.circle
        cx="36"
        cy="36"
        r="32"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <motion.circle
        cx="36"
        cy="36"
        r="32"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d="M22 37.5 L32 47 L51 26"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.svg>
    {label && (
      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="text-sm font-semibold text-foreground"
      >
        {label}
      </motion.p>
    )}
  </div>
);
