# Edge Runtime Stubs

This directory contains stub modules that replace electron-specific and Node.js-specific modules when running in web/Edge Runtime environments.

## Purpose

These stubs prevent Edge Runtime errors by providing minimal implementations of modules that are not available in the Edge Runtime environment. They are automatically used via webpack aliases when `NEXT_PUBLIC_IS_DESKTOP_APP` is not set to '1'.

## Stub Files

- **electron.ts** - Replaces the `electron` module
- **electron-server-ipc.ts** - Replaces `@lobechat/electron-server-ipc` package
- **fs.ts** - Replaces Node.js `fs` module
- **path.ts** - Replaces Node.js `path` module
- **pg.ts** - Replaces PostgreSQL client
- **pg-native.ts** - Replaces native PostgreSQL bindings
- **pino-pretty.ts** - Replaces pino-pretty logger
- **ts-md5.ts** - Replaces ts-md5 hashing library
- **database-electron.ts** - Replaces electron database implementation
- **ElectronIPCClient.ts** - Replaces ElectronIPCClient module
- **desktop-package.json** - Replaces desktop app package.json imports

## How It Works

1. The webpack configuration in `next.config.ts` checks if the app is running in desktop mode
2. If not in desktop mode, webpack aliases are configured to replace imports of electron/Node.js modules with these stubs
3. The stubs throw appropriate errors when their methods are called, preventing silent failures
4. Dynamic imports in the codebase (like in `db-adaptor.ts` and file service) provide additional runtime protection

## Adding New Stubs

When adding new electron-specific modules:

1. Create a stub file in this directory
2. Add the webpack alias in `next.config.ts`
3. Ensure the main code uses dynamic imports with proper Edge Runtime checks

## Testing

To verify stubs are working:

1. Build without `NEXT_PUBLIC_IS_DESKTOP_APP=1`
2. Deploy to Edge Runtime environment
3. Check that no electron/Node.js module errors occur
