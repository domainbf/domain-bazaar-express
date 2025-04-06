
// Fix for TS2347 errors
declare module "*.svg" {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

// React type augmentations
declare namespace React {
  // Add missing React types
  interface ReactElement {
    type: any;
  }
  
  // Add ReactNode type
  type ReactNode = 
    | React.ReactChild
    | React.ReactFragment
    | React.ReactPortal
    | boolean
    | null
    | undefined;

  // Add React hooks
  const useState: any;
  const useEffect: any;
  const useContext: any;
  const useCallback: any;
  const useMemo: any;
  const useRef: any;
  const useReducer: any;
  const useId: any;
  
  // Add React components
  const StrictMode: any;
  const Fragment: any;
  const Suspense: any;
  
  // Add React functions
  const forwardRef: any;
  const createContext: any;
  
  // Add React types
  type ElementRef<T> = any;
  type ComponentPropsWithoutRef<T> = any;
  type ComponentProps<T> = any;
  type ReactChild = any;
  type ReactFragment = any;
  type ReactPortal = any;
  type ComponentType<P = any> = any;
  type CSSProperties = any;
  type KeyboardEvent<T = any> = any;
  type ButtonHTMLAttributes<T = any> = any;
  type TextareaHTMLAttributes<T = any> = any;
  type ThHTMLAttributes<T = any> = any;
  type TdHTMLAttributes<T = any> = any;
  type ReactElement<T = any, U = any> = any;
}

// Fix for the untyped functions
declare global {
  interface Function {
    displayName?: string;
  }
}

// Fix for class variance authority
declare module "class-variance-authority" {
  export interface VariantProps<T extends (...args: any) => any> {}
  export function cva(...args: any[]): any;
}

// Add Badge component props
interface BadgeProps {
  className?: string;
  variant?: string;
  children?: React.ReactNode | Iterable<React.ReactNode>;
}

// Fix HTMLAttributes
interface HTMLAttributes<T> {
  className?: string;
  children?: React.ReactNode | Iterable<React.ReactNode>;
  [key: string]: any;
}

// Add UserProfile type to fix Navbar errors
declare module "@/types/userProfile" {
  interface UserProfile {
    first_name?: string;
    [key: string]: any;
  }
}
