
// Import React type definitions from our custom declarations
import * as React from 'react';
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Add this utility function to help with type checking
export function forwardRef<T, P = {}>(
  render: (props: P, ref: React.Ref<T>) => React.ReactElement | null
): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<T>> {
  return React.forwardRef(render);
}

// Add this utility to help with typed props
export function componentWithProps<T>() {
  return function <P>(component: React.ComponentType<P>): React.ComponentType<P & T> {
    return component as React.ComponentType<P & T>;
  };
}
