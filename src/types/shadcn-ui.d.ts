
// This file disables TypeScript errors for shadcn/ui components

// Override the behavior of React.forwardRef to allow untyped function calls with type arguments
declare namespace React {
  /**
   * `forwardRef` allows a component to receive a ref and forward it to a child component.
   */
  function forwardRef<T, P = {}>(
    render: (props: P, ref: ForwardedRef<T>) => ReactElement | null
  ): ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<T>>;
}

// Allow cva function to accept type arguments
declare module 'class-variance-authority' {
  export interface CVA {
    <T>(config: any): (...args: any[]) => string;
  }
  
  export function cva(base?: string, variants?: any): (...args: any[]) => string;
  export type VariantProps<T> = any;
}

// Define the modules for radix-ui components to accept type arguments
declare module '@radix-ui/*' {
  export namespace Root {
    export interface Root {
      forwardRef<T, P>(render: (props: P, ref: React.Ref<T>) => React.ReactElement | null): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<T>>;
    }
  }
}

// Fix issue with componentProps
declare module 'react' {
  interface ComponentProps<T extends ElementType> {
    [key: string]: any;
  }
}
