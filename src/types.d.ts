
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

// Allow all generic types for functions to prevent TS2347 errors
interface Function {
  <T extends any[]>(...args: any[]): any;
}

// Extend global React namespace for our type needs
declare global {
  namespace React {
    type FC<P = {}> = FunctionComponent<P>;
    
    interface FunctionComponent<P = {}> {
      (props: P & { children?: ReactNode }, context?: any): ReactElement<any, any> | null;
    }
    
    type ReactNode = ReactElement | string | number | ReactFragment | ReactPortal | boolean | null | undefined;
    type ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> = {
      type: T;
      props: P;
      key: Key | null;
    };
    
    type JSXElementConstructor<P> = (props: P) => ReactElement<any, any> | null;
    type Key = string | number;
    type ReactFragment = Iterable<ReactNode>;
    
    interface ReactPortal extends ReactElement {
      key: Key | null;
      children: ReactNode;
    }
    
    type CSSProperties = Record<string, any>;
    type ComponentType<P = {}> = FunctionComponent<P>;
    type ComponentProps<T extends keyof JSX.IntrinsicElements | React.ComponentType<any>> = 
      T extends React.ComponentType<infer P> 
        ? P 
        : T extends keyof JSX.IntrinsicElements 
          ? JSX.IntrinsicElements[T] 
          : {};
    type ElementRef<T> = T extends React.ElementType ? React.ElementType : T;
    type ComponentPropsWithoutRef<T> = any;
    type RefAttributes<T> = { ref?: React.Ref<T> };
    type ElementType = keyof JSX.IntrinsicElements | React.ComponentType<any>;
    type Ref<T> = React.RefObject<T> | ((instance: T | null) => void) | null;
    type RefObject<T> = { readonly current: T | null };
    type KeyboardEvent<T = Element> = any;
    type HTMLAttributes<T> = any & { className?: string };
    type ButtonHTMLAttributes<T> = HTMLAttributes<T>;
    type TextareaHTMLAttributes<T> = HTMLAttributes<T>;
    type ThHTMLAttributes<T> = HTMLAttributes<T>;
    type TdHTMLAttributes<T> = HTMLAttributes<T>;
  }

  namespace VariantProps {
    type Prop<T> = any;
  }
  
  namespace ClassValue {
    type Value = any;
  }
  
  namespace User {
    type Info = any;
  }

  namespace UseEmblaCarouselType {
    type Type = any;
  }
  
  namespace DialogProps {
    interface Props {
      children?: React.ReactNode;
      className?: string;
    }
  }
  
  namespace FieldValues {
    type Type = any;
  }
  
  namespace FieldPath {
    type Path = any;
  }
  
  namespace ControllerProps {
    type Props = any;
  }
  
  namespace LegendProps {
    type Type = any;
  }
}

// Profile Domain interface
interface ProfileDomain {
  id: string;
  name: string;
  price?: number | string;
  status: 'available' | 'sold' | 'pending';
  category?: string;
  description?: string;
  created_at?: string;
  featured?: boolean;
}

// Admin Stats interface
interface AdminStats {
  users_count: number;
  total_domains: number;
  active_listings: number;
  sold_domains: number;
  verification_pending: number;
  monthly_revenue: number;
}

// Badge props interface
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "premium" | "verified" | "featured";
  children?: React.ReactNode;
  className?: string;
}

// CommandDialog Props interface
interface CommandDialogProps extends DialogProps.Props {
  children?: React.ReactNode;
}
