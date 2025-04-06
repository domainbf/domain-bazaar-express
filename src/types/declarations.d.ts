
// Fix for TS2347 errors
declare module "*.svg" {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

// Fix for type augmentation
declare namespace React {
  interface ReactElement {
    type: any;
  }
}

// Fix for the untyped functions
declare global {
  interface Function {
    displayName?: string;
  }
}

// Fix for react node
declare module "react" {
  interface ReactNode {
    children?: ReactNode;
  }
}

// Fix for class variance authority
declare module "class-variance-authority" {
  export interface VariantProps<T extends (...args: any) => any> {}
  export function cva(...args: any[]): any;
}
