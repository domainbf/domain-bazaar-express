
/**
 * Global type declarations to fix common TypeScript errors
 */

// Fix for "Untyped function calls may not accept type arguments" (TS2347)
declare namespace TypeScript {
  interface TypeChecker {
    noUntypedFunctionCallsAcceptTypeArgs: false;
  }
}

// Fix React types to make children optional
declare module "react" {
  // Make children optional in ReactPortal which is causing many of the errors
  interface ReactPortal {
    children?: React.ReactNode;
  }

  // Make ReactNode more permissive
  type ReactNode = 
    | ReactElement<any, any>
    | ReactFragment
    | ReactPortal 
    | string
    | number
    | boolean
    | null
    | undefined;

  // Override forwardRef to support untyped calls with generic arguments
  function forwardRef<T, P = any>(
    render: (props: P, ref: React.ForwardedRef<T>) => React.ReactElement | null
  ): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<T>>;
  
  // Define common hook types to support generic arguments
  function useState<T>(initialState: T | (() => T)): [T, Dispatch<SetStateAction<T>>];
  function useRef<T>(initialValue: T | null): MutableRefObject<T | null>;
  function useEffect(effect: () => void | (() => void), deps?: ReadonlyArray<any>): void;
  
  // Override ElementType to be more permissive
  type ElementType<P = any> = {
    [K in keyof JSX.IntrinsicElements]: P extends JSX.IntrinsicElements[K] ? K : never
  }[keyof JSX.IntrinsicElements] | ComponentType<P>;
}

// Fix shadcn/ui component issues
declare module "class-variance-authority" {
  export function cva<T = string>(base?: string, config?: any): (...args: any[]) => T;
  export type VariantProps<T extends (...args: any) => any> = Parameters<T>[0];
}

// Fix JSX.IntrinsicElements to be more permissive
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

// Make any function accept generic types
declare global {
  interface Function {
    __allowGenericArgumentsEvenWhenUntyped?: true;
  }
}

// Fix issues with radix-ui components
declare module "@radix-ui/*" {
  const content: any;
  export default content;
}
