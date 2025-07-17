import analyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';
import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';
import path from 'node:path';
import ReactComponentName from 'react-scan/react-component-name/webpack';

const isProd = process.env.NODE_ENV === 'production';
const buildWithDocker = process.env.DOCKER === 'true';
const isDesktop = process.env.NEXT_PUBLIC_IS_DESKTOP_APP === '1';
const enableReactScan = !!process.env.REACT_SCAN_MONITOR_API_KEY;
const isUsePglite = process.env.NEXT_PUBLIC_CLIENT_DB === 'pglite';

// if you need to proxy the api endpoint to remote server

const basePath = process.env.NEXT_PUBLIC_BASE_PATH;
const isStandaloneMode = buildWithDocker || isDesktop;

const standaloneConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: { '*': ['public/**/*', '.next/static/**/*'] },
};

const nextConfig: NextConfig = {
  ...(isStandaloneMode ? standaloneConfig : {}),
  basePath,
  compress: isProd,
  experimental: {
    optimizePackageImports: [
      'emoji-mart',
      '@emoji-mart/react',
      '@emoji-mart/data',
      '@icons-pack/react-simple-icons',
      '@lobehub/ui',
      'gpt-tokenizer',
    ],
    // oidc provider depend on constructor.name
    // but swc minification will remove the name
    // so we need to disable it
    // refs: https://github.com/lobehub/lobe-chat/pull/7430
    serverMinification: false,
    webVitalsAttribution: ['CLS', 'LCP'],
  },
  async headers() {
    return [
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/icons/(.*).(png|jpe?g|gif|svg|ico|webp)',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/images/(.*).(png|jpe?g|gif|svg|ico|webp)',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/videos/(.*).(mp4|webm|ogg|avi|mov|wmv|flv|mkv)',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/screenshots/(.*).(png|jpe?g|gif|svg|ico|webp)',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/og/(.*).(png|jpe?g|gif|svg|ico|webp)',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/favicon.ico',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/favicon-32x32.ico',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/apple-touch-icon.png',
      },
    ];
  },
  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
  },
  reactStrictMode: true,
  redirects: async () => [
    {
      destination: '/sitemap-index.xml',
      permanent: true,
      source: '/sitemap.xml',
    },
    {
      destination: '/sitemap-index.xml',
      permanent: true,
      source: '/sitemap-0.xml',
    },
    {
      destination: '/manifest.webmanifest',
      permanent: true,
      source: '/manifest.json',
    },
    {
      destination: '/discover/assistant/:slug',
      has: [
        {
          key: 'agent',
          type: 'query',
          value: '(?<slug>.*)',
        },
      ],
      permanent: true,
      source: '/market',
    },
    {
      destination: '/discover/assistants',
      permanent: true,
      source: '/discover/assistant',
    },
    {
      destination: '/discover/models',
      permanent: true,
      source: '/discover/model',
    },
    {
      destination: '/discover/plugins',
      permanent: true,
      source: '/discover/plugin',
    },
    {
      destination: '/discover/providers',
      permanent: true,
      source: '/discover/provider',
    },
    {
      destination: '/settings/common',
      permanent: true,
      source: '/settings',
    },
    {
      destination: '/chat',
      permanent: true,
      source: '/welcome',
    },
    // TODO: 等 V2 做强制跳转吧
    // {
    //   destination: '/settings/provider/volcengine',
    //   permanent: true,
    //   source: '/settings/provider/doubao',
    // },
    // we need back /repos url in the further
    {
      destination: '/files',
      permanent: false,
      source: '/repos',
    },
  ],
  // when external packages in dev mode with turbopack, this config will lead to bundle error
  serverExternalPackages: isProd
    ? ['@electric-sql/pglite', '@lobechat/electron-server-ipc', 'pg']
    : undefined,

  transpilePackages: ['pdfjs-dist', 'mermaid'],

  webpack(config, { webpack }) {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    // Fix webpack.WebpackError for Next.js 15.3.5 in Docker builds
    if (buildWithDocker && webpack && !webpack.WebpackError) {
      // Provide WebpackError class if it's missing
      webpack.WebpackError = class WebpackError extends Error {
        error?: Error;
        details?: string;

        constructor(message: string, error?: Error) {
          super(message);
          this.name = 'WebpackError';
          this.error = error;
          this.details = error?.stack;
        }
      };
    }

    // Additionally disable optimization for Docker builds
    if (buildWithDocker) {
      config.optimization = {
        ...config.optimization,
        minimize: false,
        minimizer: [],
      };
    }

    // 开启该插件会导致 pglite 的 fs bundler 被改表
    if (enableReactScan && !isUsePglite) {
      config.plugins.push(ReactComponentName({}));
    }

    // to fix shikiji compile error
    // refs: https://github.com/antfu/shikiji/issues/23
    config.module.rules.push({
      resolve: {
        fullySpecified: false,
      },
      test: /\.m?js$/,
      type: 'javascript/auto',
    });

    // https://github.com/pinojs/pino/issues/688#issuecomment-637763276
    config.externals.push('pino-pretty');

    // Configure aliases to use stubs in web/Edge Runtime environments
    const stubsDir = path.resolve(__dirname, './src/server/modules/stubs');

    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};

    // Always apply fs-related stubs for client-side builds
    config.resolve.alias['node:fs'] = path.join(stubsDir, 'fs.ts');

    // Also apply the electron database stub globally to prevent webpack processing
    config.resolve.alias['@/database/core/electron'] = path.join(stubsDir, 'database-electron.ts');

    if (!isDesktop) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Replace desktop package.json
        '@/../apps/desktop/package.json': path.join(stubsDir, 'desktop-package.json'),
        // Replace the electron database core
        '@/database/core/electron': path.join(stubsDir, 'database-electron.ts'),
        // Replace ElectronIPCClient imports
        '@/server/modules/ElectronIPCClient': path.join(stubsDir, 'ElectronIPCClient.ts'),
        // Replace electron-related modules with stubs
        '@lobechat/electron-server-ipc': path.join(stubsDir, 'electron-server-ipc.ts'),
        'electron': path.join(stubsDir, 'electron.ts'),
        'fs': path.join(stubsDir, 'fs.ts'),
        'node:net': path.join(stubsDir, 'net.ts'),
        'net': path.join(stubsDir, 'net.ts'),
        'node:os': path.join(stubsDir, 'os.ts'),
        'os': path.join(stubsDir, 'os.ts'),
        'node:path': path.join(stubsDir, 'path.ts'),
        'path': path.join(stubsDir, 'path.ts'),
        'pg': path.join(stubsDir, 'pg.ts'),
        'pg-native': path.join(stubsDir, 'pg-native.ts'),
        'pino-pretty': path.join(stubsDir, 'pino-pretty.ts'),
        'ts-md5': path.join(stubsDir, 'ts-md5.ts'),
      };
    }

    // Exclude electron-specific packages and database packages from Edge Runtime
    // Only apply externals in desktop mode or Docker builds
    if (isDesktop || buildWithDocker) {
      if (typeof config.externals === 'object' && !Array.isArray(config.externals)) {
        config.externals['@lobechat/electron-server-ipc'] = '@lobechat/electron-server-ipc';
        config.externals['electron'] = 'electron';
        config.externals['pg'] = 'pg';
        config.externals['pg-native'] = 'pg-native';
      } else {
        config.externals = config.externals || [];
        if (Array.isArray(config.externals)) {
          config.externals.push('@lobechat/electron-server-ipc', 'electron', 'pg', 'pg-native');
        }
      }
    }

    config.resolve.alias.canvas = false;

    // Ensure pdfjs-dist can find our polyfills
    config.resolve.alias['@napi-rs/canvas'] = path.join(
      __dirname,
      'src/server/polyfills/canvas.ts',
    );

    // to ignore epub2 compile error
    // refs: https://github.com/lobehub/lobe-chat/discussions/6769
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: false,
      // Add fallbacks for Node.js modules that might be used by electron packages
      fs: false,
      path: false,
      zipfile: false,
    };
    return config;
  },
};

const noWrapper = (config: NextConfig) => config;

const withBundleAnalyzer = process.env.ANALYZE === 'true' ? analyzer() : noWrapper;

const withPWA =
  isProd && !isDesktop
    ? withSerwistInit({
        register: false,
        swDest: 'public/sw.js',
        swSrc: 'src/app/sw.ts',
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB to include WASM files
      })
    : noWrapper;

const hasSentry = !!process.env.NEXT_PUBLIC_SENTRY_DSN;
const withSentry =
  isProd && hasSentry
    ? (c: NextConfig) =>
        withSentryConfig(
          c,
          {
            org: process.env.SENTRY_ORG,

            project: process.env.SENTRY_PROJECT,
            // For all available options, see:
            // https://github.com/getsentry/sentry-webpack-plugin#options
            // Suppresses source map uploading logs during build
            silent: true,
          },
          {
            // Enables automatic instrumentation of Vercel Cron Monitors.
            // See the following for more information:
            // https://docs.sentry.io/product/crons/
            // https://vercel.com/docs/cron-jobs
            automaticVercelMonitors: true,

            // Automatically tree-shake Sentry logger statements to reduce bundle size
            disableLogger: true,

            // Hides source maps from generated client bundles
            hideSourceMaps: true,

            // Transpiles SDK to be compatible with IE11 (increases bundle size)
            transpileClientSDK: true,

            // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers. (increases server load)
            // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
            // side errors will fail.
            tunnelRoute: '/monitoring',

            // For all available options, see:
            // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
            // Upload a larger set of source maps for prettier stack traces (increases build time)
            widenClientFileUpload: true,
          },
        )
    : noWrapper;

export default withBundleAnalyzer(withPWA(withSentry(nextConfig) as NextConfig));
