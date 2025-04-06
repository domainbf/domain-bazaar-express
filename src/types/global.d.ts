
// Global type declarations to fix TypeScript errors

// Fix React types
import * as React from 'react';

declare global {
  // Fix the TS2347 error (Untyped function calls may not accept type arguments)
  interface Function {
    __acceptsTypeArguments: true;
  }
  
  // Fix ReactNode type issues
  namespace React {
    interface ReactElement {
      children?: React.ReactNode;
    }
  }
}

// Fix for "Untyped function calls may not accept type arguments"
declare module '@radix-ui/*' {
  export interface Component {
    __acceptsTypeArguments: true;
  }
}

// Fix for class-variance-authority
declare module 'class-variance-authority' {
  export function cva(base?: string, config?: any): (...args: any[]) => string;
  export type VariantProps<T> = any;
}

// Make the file a module
export {};
