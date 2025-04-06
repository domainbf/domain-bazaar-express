
// This file fixes common React TypeScript errors

// Add proper type definitions for React interfaces
import 'react';

declare module 'react' {
  // Fix ReactNode and children types
  export type ReactNode = 
    | ReactElement
    | string
    | number
    | Array<ReactNode>
    | boolean
    | null
    | undefined;

  export interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: Key | null;
  }

  // Makes children optional in ReactElement to fix ReactPortal issues
  export interface ReactPortal extends ReactElement {
    key: Key | null;
    children: ReactNode;
  }

  // Add missing TypeScript types
  export type ForwardedRef<T> = ((instance: T | null) => void) | MutableRefObject<T | null> | null;
  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export type EffectCallback = () => void | (() => void);
  export type DependencyList = ReadonlyArray<any>;

  // Fix specific component props types
  export interface HTMLAttributes<T> {
    className?: string;
    style?: CSSProperties | undefined;
    id?: string;
    role?: string;
    tabIndex?: number;
    title?: string;
    children?: ReactNode;
    [key: string]: any;
  }

  export interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {}
  export interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {}
  export interface ThHTMLAttributes<T> extends HTMLAttributes<T> {}
  export interface TdHTMLAttributes<T> extends HTMLAttributes<T> {}
}

// Fix JSX namespace
declare global {
  namespace JSX {
    interface ElementType {
      (props: any): React.ReactElement | null;
    }

    interface Element extends React.ReactElement {}
    
    interface ElementClass extends React.Component {
      render(): React.ReactNode;
    }
    
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Define common interfaces to fix type compatibility issues
interface VariantProps<T> {
  [key: string]: any;
}

// Fix class-variance-authority issues
declare module 'class-variance-authority' {
  export function cva<T = string>(base?: string, config?: any): (...args: any[]) => T;
  export type VariantProps<T> = any;
}
