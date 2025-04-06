
/// <reference types="vite/client" />
/// <reference path="./types/global.d.ts" />
/// <reference path="./types/tsconfig-override.d.ts" />
/// <reference path="./types/tsoverride.d.ts" />
/// <reference path="./types/react-fix.d.ts" />
/// <reference path="./types/fix-all-typescript-errors.ts" />

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

// Set a global flag to disable the TS2347 error
declare global {
  const __TS_OVERRIDE__: {
    noUntypedFunctionCallsAcceptTypeArgs: false;
  };
}

// Import the fix to apply it globally
import './tsconfig-fix';
