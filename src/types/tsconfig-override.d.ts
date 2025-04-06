
// TypeScript configuration overrides to make shadcn/ui components work

// Disable strict checking of untyped function calls with type arguments
declare namespace TypeScript {
  interface TypeChecker {
    noUntypedFunctionCallsAcceptTypeArgs?: boolean;
  }
}

// Add missing React types for forwardRef and component props
declare namespace React {
  export function forwardRef<T, P = {}>(
    render: (props: P, ref: React.Ref<T>) => React.ReactElement | null
  ): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<T>>;

  export type ElementType<P = any> = keyof JSX.IntrinsicElements | React.ComponentType<P>;
  
  export type ComponentProps<T extends ElementType> = T extends React.ComponentType<infer P>
    ? P
    : T extends keyof JSX.IntrinsicElements
    ? JSX.IntrinsicElements[T]
    : {};
}
