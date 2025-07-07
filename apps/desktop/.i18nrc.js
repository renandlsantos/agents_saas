const { defineConfig } = require('@lobehub/i18n-cli');

module.exports = defineConfig({
  entry: 'resources/locales/zh-CN',
  entryLocale: 'zh-CN',
  output: 'resources/locales',
  outputLocales: ['en-US', 'es-ES', 'pt-BR'],
  temperature: 0,
  modelName: 'gpt-4o-mini',
  experimental: {
    jsonMode: true,
  },
});
