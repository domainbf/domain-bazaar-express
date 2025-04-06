
// This file extends React's type definitions to fix compatibility issues

import 'react';

declare module 'react' {
  // Add missing React types that shadcn components require
  export interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: Key | null;
  }

  export type ReactNode = 
    | ReactElement 
    | string 
    | number 
    | Iterable<ReactNode> 
    | ReactPortal 
    | boolean 
    | null 
    | undefined;
  
  export type RefObject<T> = { readonly current: T | null };
  export type Ref<T> = RefObject<T> | ((instance: T | null) => void) | null;
  export type Key = string | number;
  export type ComponentType<P = {}> = FunctionComponent<P>;
  export type ReactPortal = ReactElement & { key: Key | null; children: ReactNode };

  export interface FunctionComponent<P = {}> {
    (props: P & { children?: ReactNode }, context?: any): ReactElement<any, any> | null;
    displayName?: string;
    defaultProps?: Partial<P>;
  }

  export type FC<P = {}> = FunctionComponent<P>;
  export type JSXElementConstructor<P> = ((props: P) => ReactElement<any, any> | null) | (new (props: P) => Component<any, any>);

  export type ElementRef<T extends ElementType> = T extends ComponentType<any>
    ? InstanceType<T>
    : T extends keyof JSX.IntrinsicElements
    ? JSX.IntrinsicElements[T] extends React.DetailedHTMLProps<React.HTMLAttributes<infer R>, any>
      ? R
      : never
    : unknown;

  export type ComponentProps<T extends ElementType> = T extends ComponentType<infer P>
    ? P
    : T extends keyof JSX.IntrinsicElements
    ? JSX.IntrinsicElements[T]
    : never;

  export type ComponentPropsWithoutRef<T extends ElementType> = Omit<ComponentProps<T>, 'ref'>;
  export type ElementType<P = any> = keyof JSX.IntrinsicElements | React.ComponentType<P>;
  export type CSSProperties = React.CSSProperties & Record<`--${string}`, string | number>;

  export interface KeyboardEvent<T = Element> {
    key: string;
    code: string;
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
    preventDefault(): void;
    stopPropagation(): void;
  }

  export interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    autoFocus?: boolean;
    disabled?: boolean;
    form?: string;
    formAction?: string;
    formEncType?: string;
    formMethod?: string;
    formNoValidate?: boolean;
    formTarget?: string;
    name?: string;
    type?: 'submit' | 'reset' | 'button';
    value?: string | ReadonlyArray<string> | number;
  }

  export interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
    autoComplete?: string;
    autoFocus?: boolean;
    cols?: number;
    dirName?: string;
    disabled?: boolean;
    form?: string;
    maxLength?: number;
    minLength?: number;
    name?: string;
    placeholder?: string;
    readOnly?: boolean;
    required?: boolean;
    rows?: number;
    value?: string | ReadonlyArray<string> | number;
    wrap?: string;
  }

  export interface ThHTMLAttributes<T> extends HTMLAttributes<T> {
    abbr?: string;
    colSpan?: number;
    headers?: string;
    rowSpan?: number;
    scope?: string;
  }

  export interface TdHTMLAttributes<T> extends HTMLAttributes<T> {
    abbr?: string;
    colSpan?: number;
    headers?: string;
    rowSpan?: number;
  }

  export interface HTMLAttributes<T> {
    className?: string;
    style?: CSSProperties;
    id?: string;
    role?: string;
    tabIndex?: number;
    title?: string;
    onClick?: (event: any) => void;
    onFocus?: (event: any) => void;
    onBlur?: (event: any) => void;
    onKeyDown?: (event: any) => void;
    onKeyUp?: (event: any) => void;
    onMouseDown?: (event: any) => void;
    onMouseUp?: (event: any) => void;
    onMouseEnter?: (event: any) => void;
    onMouseLeave?: (event: any) => void;
    onTouchStart?: (event: any) => void;
    onTouchEnd?: (event: any) => void;
    onTouchMove?: (event: any) => void;
    children?: ReactNode;
  }

  export type ForwardRefExoticComponent<P> = React.ForwardRefExoticComponent<P>;
  export type PropsWithoutRef<P> = React.PropsWithoutRef<P>;
  export type RefAttributes<T> = React.RefAttributes<T>;

  // Add any other missing types here
}

declare module 'recharts' {
  export interface LegendProps {
    align?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    layout?: 'horizontal' | 'vertical';
    iconSize?: number;
    iconType?: 'line' | 'square' | 'rect' | 'circle' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye';
    formatter?: (value: any, entry: any, index: number) => React.ReactNode;
    payload?: Array<{ value: any; type: string; id: string; color: string }>;
    content?: React.ReactElement | ((props: any) => React.ReactNode);
    wrapperStyle?: React.CSSProperties;
    chartWidth?: number;
    chartHeight?: number;
    width?: number;
    height?: number;
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    onClick?: (e: any) => void;
    onMouseDown?: (e: any) => void;
    onMouseUp?: (e: any) => void;
    onMouseMove?: (e: any) => void;
    onMouseOver?: (e: any) => void;
    onMouseOut?: (e: any) => void;
    onMouseEnter?: (e: any) => void;
    onMouseLeave?: (e: any) => void;
  }
}
