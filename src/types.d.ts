
// Declare modules for packages
declare module 'react';
declare module 'react-dom/client';
declare module 'react-router-dom';
declare module 'sonner';
declare module 'lucide-react';
declare module '@radix-ui/react-accordion';
declare module '@radix-ui/react-alert-dialog';
declare module '@radix-ui/react-aspect-ratio';
declare module '@radix-ui/react-avatar';
declare module '@radix-ui/react-checkbox';
declare module '@radix-ui/react-collapsible';
declare module '@radix-ui/react-context-menu';
declare module '@radix-ui/react-dialog';
declare module '@radix-ui/react-dropdown-menu';
declare module '@radix-ui/react-hover-card';
declare module '@radix-ui/react-label';
declare module '@radix-ui/react-menubar';
declare module '@radix-ui/react-navigation-menu';
declare module '@radix-ui/react-popover';
declare module '@radix-ui/react-progress';
declare module '@radix-ui/react-radio-group';
declare module '@radix-ui/react-scroll-area';
declare module '@radix-ui/react-select';
declare module '@radix-ui/react-separator';
declare module '@radix-ui/react-slider';
declare module '@radix-ui/react-slot';
declare module '@radix-ui/react-switch';
declare module '@radix-ui/react-tabs';
declare module '@radix-ui/react-toast';
declare module '@radix-ui/react-toggle';
declare module '@radix-ui/react-toggle-group';
declare module '@radix-ui/react-tooltip';
declare module '@supabase/supabase-js';
declare module '@tanstack/react-query';
declare module 'class-variance-authority';
declare module 'clsx';
declare module 'cmdk';
declare module 'date-fns';
declare module 'embla-carousel-react';
declare module 'framer-motion';
declare module 'i18next';
declare module 'input-otp';
declare module 'next-themes';
declare module 'react-day-picker';
declare module 'react-hook-form';
declare module 'react-i18next';
declare module 'react-resizable-panels';
declare module 'recharts';
declare module 'tailwind-merge';
declare module 'vaul';

// Define global types to fix TypeScript errors
declare global {
  namespace React {
    // ReactNode and other common types
    type ReactNode = React.ReactElement | string | number | React.ReactFragment | React.ReactPortal | boolean | null | undefined;
    interface ReactElement<P = any, T extends string | React.JSXElementConstructor<any> = string | React.JSXElementConstructor<any>> {
      type: T;
      props: P;
      key: React.Key | null;
    }
    type Key = string | number;
    type ReactFragment = Iterable<ReactNode>;
    type ReactPortal = ReactElement & { key: Key | null; children: ReactNode };
    type RefObject<T> = { readonly current: T | null };
    type Ref<T> = RefObject<T> | ((instance: T | null) => void) | null;
    
    // Component types
    type FC<P = {}> = FunctionComponent<P>;
    interface FunctionComponent<P = {}> {
      (props: P & { children?: ReactNode }, context?: any): ReactElement<any, any> | null;
    }
    type ComponentType<P = {}> = FunctionComponent<P>;
    type ElementType = keyof JSX.IntrinsicElements | React.ComponentType<any>;
    
    // Element ref and props types
    type ElementRef<T extends React.ElementType> = T extends React.ElementType ? React.ElementType : T;
    type ComponentProps<T extends keyof JSX.IntrinsicElements | React.ComponentType<any>> = 
      T extends React.ComponentType<infer P> ? P : 
      T extends keyof JSX.IntrinsicElements ? JSX.IntrinsicElements[T] : {};
    type ComponentPropsWithoutRef<T> = Omit<ComponentProps<T>, 'ref'>;
    
    // HTML attributes and event types
    interface HTMLAttributes<T> {
      className?: string;
      style?: CSSProperties;
      id?: string;
      // Add other common attributes as needed
    }
    interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {}
    interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {}
    interface ThHTMLAttributes<T> extends HTMLAttributes<T> {}
    interface TdHTMLAttributes<T> extends HTMLAttributes<T> {}
    
    // Event types
    interface KeyboardEvent<T = Element> {
      key: string;
      code: string;
      altKey: boolean;
      ctrlKey: boolean;
      metaKey: boolean;
      shiftKey: boolean;
      preventDefault(): void;
      stopPropagation(): void;
    }
    
    // Style types
    interface CSSProperties {
      [key: string]: string | number | null | undefined;
    }
  }
}

// Define interfaces for variant props
interface VariantProps<T> {
  [key: string]: any;
}

// Define class value type
type ClassValue = string | number | boolean | undefined | null | ClassValue[] | Record<string, boolean | undefined | null>;

// Define use embla carousel type
interface UseEmblaCarouselType {
  0: (ref: HTMLElement | null) => void;
  1: any;
}

// Dialog props interface
interface DialogProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

// React Hook Form types
interface FieldValues extends Record<string, any> {}
type FieldPath<T = FieldValues> = string;

interface ControllerProps<T = any, TName extends string = string> {
  name: TName;
  control?: any;
  defaultValue?: any;
  rules?: any;
  render: (props: { field: any; fieldState: any; formState: any }) => React.ReactElement;
}

// Recharts types
interface LegendProps {
  [key: string]: any;
}

// Badge Props
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "premium" | "verified" | "featured";
}

// Add AdminStats interface
interface AdminStats {
  users_count: number;
  total_domains: number;
  active_listings: number;
  sold_domains: number;
  verification_pending: number;
  monthly_revenue: number;
  total_offers?: number;
  recent_transactions?: number;
}

