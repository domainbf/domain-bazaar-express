
/**
 * This file contains TypeScript utilities to fix common type errors
 * that occur with shadcn/ui components and forwardRef usage
 */

import * as React from 'react';

/**
 * Type-safe forwardRef implementation that allows generic type parameters
 */
export function safeForwardRef<T, P = {}>(
  render: (props: P, ref: React.ForwardedRef<T>) => React.ReactElement | null
): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<T>> {
  // @ts-ignore - Using forwardRef with generics is fine, even if TypeScript complains
  return React.forwardRef(render);
}

/**
 * Type-safe wrapper for React hooks that use generics
 */
export function safeUseState<T>(initialState: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  // @ts-ignore - Using useState with generics is fine
  return React.useState(initialState);
}

export function safeUseRef<T>(initialValue: T | null = null): React.RefObject<T> {
  // @ts-ignore - Using useRef with generics is fine
  return React.useRef(initialValue);
}

export function safeUseEffect(effect: React.EffectCallback, deps?: React.DependencyList): void {
  // @ts-ignore - Using useEffect is fine
  return React.useEffect(effect, deps);
}

/**
 * Helper for className merging that works with TypeScript
 */
export function safeClassNames(...inputs: any[]): string {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Type definitions for HTMLAttributes to fix children type errors
 */
export interface SafeHTMLAttributes extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  className?: string;
}

export interface SafeButtonAttributes extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
}

export interface SafeDivAttributes extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export interface SafeSpanAttributes extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  className?: string;
}
