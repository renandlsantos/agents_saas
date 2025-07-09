// This module re-exports all SSO providers including the credentials provider
// It should only be used in Node.js runtime, not in Edge Runtime

import Credentials from './credentials';

import { ssoProviders } from './index';

export { default as Credentials } from './credentials';
export * from './index';

// Export the full list including credentials
export const ssoProvidersWithCredentials = [...ssoProviders, Credentials];