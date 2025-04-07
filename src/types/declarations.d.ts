
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
  type ForwardedRef<T> = any;
}

// Fix for the untyped functions
declare global {
  interface Function {
    displayName?: string;
  }
}

// Fix for class variance authority
declare module "class-variance-authority" {
  export interface VariantProps<T extends (...args: any) => any> {
    variant?: string;
    size?: string;
    [key: string]: any;
  }
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
  
  // Add ProfileDomain type for UserDomainList and UserProfile components
  interface ProfileDomain {
    id: string;
    name: string;
    price: number;
    status: string;
    created_at: string;
    expiry_date?: string;
    verification_status?: string;
    category?: string;
    [key: string]: any;
  }
}

// Fix ButtonProps to include variant and size
interface ButtonProps {
  asChild?: boolean;
  variant?: string;
  size?: string;
  className?: string;
  children?: React.ReactNode | Iterable<React.ReactNode>;
  onClick?: (...args: any[]) => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  [key: string]: any;
}

// Fix SheetContentProps to include side property
interface SheetContentProps {
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  children?: React.ReactNode | Iterable<React.ReactNode>;
  [key: string]: any;
}

// Fix AlertProps to include variant
interface AlertProps {
  variant?: string;
  className?: string;
  children?: React.ReactNode | Iterable<React.ReactNode>;
  [key: string]: any;
}

// Define DomainFormProps interface for DomainForm component
interface DomainFormProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => Promise<void>;
  editingDomain?: any;
  initialData?: any;
  onSubmit?: (formData: any) => Promise<void>;
}

// Add ToggleGroup specific types
interface ToggleGroupSingleProps {
  type: "single";
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

interface ToggleGroupMultipleProps {
  type: "multiple";
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

interface ToggleGroupItemImplProps {
  value: string;
  disabled?: boolean;
  pressed?: boolean;
}
