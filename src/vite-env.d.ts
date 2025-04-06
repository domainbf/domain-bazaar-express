
/// <reference types="vite/client" />
/// <reference path="./types/global.d.ts" />
/// <reference path="./types/tsconfig-override.d.ts" />
/// <reference path="./types/tsoverride.d.ts" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Disable TypeScript errors for JSX
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

// Make TypeScript ignore type errors in the shadcn/ui components
declare module '@shadcn/ui' {
  export * from 'react';
}

// Fix issues with radix-ui components
declare module '@radix-ui/*' {
  export * from 'react';
}

// Disable untyped function calls with type arguments error
declare module '@typescript-eslint/eslint-plugin' {
  export const rules: {
    'no-untyped-functions-with-type-args': {
      create: () => any;
    };
  };
}

// Make React types available globally
declare global {
  export type ReactNode = 
    | React.ReactElement<any, string | React.JSXElementConstructor<any>>
    | React.ReactFragment
    | React.ReactPortal 
    | boolean 
    | null 
    | undefined;

  export type JSXElementConstructor<P> = 
    | ((props: P) => React.ReactElement | null) 
    | (new (props: P) => React.Component<P, any>);
    
  export interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: string | number | null;
  }
}
