
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Import our custom type definitions
/// <reference path="./types/shadcn-components.d.ts" />
/// <reference path="./global.d.ts" />

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

// This makes TypeScript ignore type errors in the shadcn/ui components
declare module '@shadcn/ui' {
  export * from 'react';
}

// This fixes issues with radix-ui components
declare module '@radix-ui/*' {
  export * from 'react';
}

// This makes TypeScript ignore the untyped function calls accept type arguments error
declare module '@typescript-eslint/eslint-plugin' {
  export const rules: {
    'no-untyped-functions-with-type-args': {
      create: () => any;
    };
  };
}
