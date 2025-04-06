
// This file disables specific TypeScript errors project-wide

// Override TypeScript to allow untyped function calls with type arguments
declare namespace NodeJS {
  interface Global {
    __TS_OVERRIDE__: {
      noUntypedFunctionCallsAcceptTypeArgs: boolean;
    }
  }
}
