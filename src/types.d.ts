
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
declare module 'lovable-tagger';
declare module 'next-themes';
declare module 'react-day-picker';
declare module 'react-hook-form';
declare module 'react-i18next';
declare module 'react-resizable-panels';
declare module 'recharts';
declare module 'tailwind-merge';
declare module 'vaul';

// Add React.FC and React.ReactNode definitions
declare namespace React {
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
}
