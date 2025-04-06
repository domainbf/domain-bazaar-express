
/// <reference types="node" />
/// <reference types="react" />
/// <reference types="react-dom" />

// This ensures that TypeScript accepts all JSX properties
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.md' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

// Make TypeScript happy with the shadcn-ui components
declare module '@radix-ui/*' {
  const content: any;
  export default content;
  export * from 'react';
}

// Fix for untyped function call errors
interface Window {
  __REACT_DEVTOOLS_GLOBAL_HOOK__: any;
}

// Fix for untyped function arguments
declare module 'class-variance-authority' {
  export function cva(base?: string, variants?: any): (...args: any[]) => string;
  export type VariantProps<T> = any;
}
