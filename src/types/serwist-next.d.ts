declare module '@serwist/next' {
  // Basic types for @serwist/next package
  // Add more specific types as needed
  export interface SerwistConfig {
    swSrc?: string;
    swDest?: string;
    disable?: boolean;
    [key: string]: any;
  }

  export function withSerwist(config: any): any;
  export default withSerwist;
}

declare module '@serwist/next/worker' {
  export const defaultCache: any;
}