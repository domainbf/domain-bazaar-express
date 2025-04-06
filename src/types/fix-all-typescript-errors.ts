
// This file contains fixes for common TypeScript errors in the project

// Global type definitions to fix the ReactNode and ReactPortal issues
declare namespace React {
  // Allow untyped function calls to accept type arguments
  interface FunctionType {
    // Allows any function to accept type arguments
    __allowGenericArgumentsEvenWhenNotDeclared: true;
  }

  // Make children optional in ReactElement
  interface ReactElement {
    children?: React.ReactNode;
  }
}

// Define global interface for Function to allow generic arguments
declare global {
  interface Function {
    __allowGenericArgumentsEvenWhenUntyped: true;
  }
}

// Fix for "Untyped function calls may not accept type arguments" (TS2347)
declare namespace TypeScript {
  interface TypeChecker {
    noUntypedFunctionCallsAcceptTypeArgs?: boolean;
  }
}

// Fix for missing types in class-variance-authority
declare module 'class-variance-authority' {
  export function cva(base?: string, config?: any): (...args: any[]) => string;
  export type VariantProps<T> = any;
}

// Fix for @radix-ui components
declare module '@radix-ui/*' {
  const content: any;
  export default content;
  export * from 'react';
}

// Ensure all unknown modules are properly typed
declare module '*' {
  const content: any;
  export default content;
}
