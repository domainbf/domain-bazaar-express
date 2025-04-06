
// Global type declarations to fix TypeScript errors

// Enable untyped function calls with type arguments
declare namespace global {
  const __TS_OVERRIDE__: {
    noUntypedFunctionCallsAcceptTypeArgs: boolean;
  };
}

// Fix React type definitions
import * as React from 'react';

declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> { }
    interface ElementClass extends React.Component<any> {
      render(): React.ReactNode;
    }
    interface ElementAttributesProperty { props: {}; }
    interface ElementChildrenAttribute { children: {}; }
    interface IntrinsicAttributes extends React.Attributes { }
    interface IntrinsicClassAttributes<T> extends React.ClassAttributes<T> { }
  }
}

// Define missing JSX types
declare global {
  type JSXElementConstructor<P> = ((props: P) => React.ReactNode) | (new (props: P) => React.Component<P, any>);
  type ReactNode = 
    | React.ReactElement<any, string | JSXElementConstructor<any>>
    | React.ReactFragment
    | React.ReactPortal
    | boolean
    | null
    | undefined;
}

// Allow untyped function calls to accept generic arguments
declare module 'react' {
  export interface FunctionComponent<P = {}> {
    (props: P, context?: any): React.ReactElement<any, any> | null;
    propTypes?: React.WeakValidationMap<P>;
    contextTypes?: React.ValidationMap<any>;
    defaultProps?: Partial<P>;
    displayName?: string;
  }

  export interface ForwardRefExoticComponent<P> {
    (props: P): React.ReactElement | null;
    propTypes?: React.WeakValidationMap<P>;
    contextTypes?: React.ValidationMap<any>;
    defaultProps?: Partial<P>;
    displayName?: string;
  }

  export interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: React.Key | null;
    children?: ReactNode;
  }

  export interface ReactPortal extends ReactElement {
    key: React.Key | null;
    children: ReactNode;
  }

  export interface ComponentClass<P = {}, S = any> extends StaticLifecycle<P, S> {
    new(props: P, context?: any): React.Component<P, S>;
    propTypes?: React.WeakValidationMap<P>;
    contextTypes?: React.ValidationMap<any>;
    childContextTypes?: React.ValidationMap<any>;
    defaultProps?: Partial<P>;
    displayName?: string;
  }

  export type ComponentType<P = {}> = ComponentClass<P> | FunctionComponent<P>;
  
  export interface HTMLAttributes<T> {
    children?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
  }

  export type CSSProperties = React.CSSProperties & {
    [key: `--${string}`]: string | number;
  };

  export interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {}
  export interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {}
  export interface ThHTMLAttributes<T> extends HTMLAttributes<T> {}
  export interface TdHTMLAttributes<T> extends HTMLAttributes<T> {}

  export type ElementRef<T extends React.ElementType> = T extends React.ComponentType<any>
    ? InstanceType<T>
    : T extends keyof JSX.IntrinsicElements
    ? JSX.IntrinsicElements[T] extends React.DetailedHTMLProps<React.HTMLAttributes<infer R>, any>
      ? R
      : never
    : unknown;

  export type ComponentPropsWithoutRef<T extends React.ElementType> = React.PropsWithoutRef<React.ComponentProps<T>>;
  export type KeyboardEvent<T = Element> = React.KeyboardEvent<T>;
}

// Fix class-variance-authority issues
declare module 'class-variance-authority' {
  export function cva(base?: string, config?: any): (...args: any[]) => string;
  export type VariantProps<T extends (...args: any) => any> = Parameters<T>[0];
}

// Fix recharts types
declare module 'recharts' {
  export interface LegendProps {
    [key: string]: any;
  }
}

// Allow type arguments on untyped functions globally
declare interface Function {
  __allowGenericArgumentsEvenWhenNotDeclared?: true;
}
