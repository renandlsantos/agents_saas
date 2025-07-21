declare module '@serwist/next' {
  // Basic types for @serwist/next package
  // Add more specific types as needed
  export interface SerwistConfig {
    [key: string]: any;
    disable?: boolean;
    swDest?: string;
    swSrc?: string;
  }

  export function withSerwist(config: any): any;
  export default withSerwist;
}

declare module '@serwist/next/worker' {
  export const defaultCache: any;
}