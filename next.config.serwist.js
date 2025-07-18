/** @type {import('next').NextConfig['webpack']} */
const serwistWebpack = (config, { isServer }) => {
  if (!isServer) {
    config.plugins.push(
      new (require('@serwist/webpack-plugin').InjectManifest)({
        swSrc: './src/sw.ts',
        swDest: './public/sw.js',
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB to include WASM files
      }),
    );
  }
  return config;
};

module.exports = serwistWebpack;
