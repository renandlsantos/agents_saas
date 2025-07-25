// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

import { PluginStore } from './index';

const baseURL = 'https://chat-plugins.lobehub.com';

describe('PluginStore', () => {
  it('should return the default index URL when no language is provided', () => {
    const pluginStore = new PluginStore();
    const url = pluginStore.getPluginIndexUrl();
    expect(url).toBe(`${baseURL}/index.en-US.json`);
  });

  it('should return the index URL for a supported language', () => {
    const pluginStore = new PluginStore();
    const url = pluginStore.getPluginIndexUrl('en-US');
    expect(url).toBe(`${baseURL}/index.en-US.json`);
  });

  it('should return the base URL if the provided language is not supported', () => {
    const pluginStore = new PluginStore();
    const url = pluginStore.getPluginIndexUrl('es-ES');
    expect(url).toBe(`${baseURL}/index.es-ES.json`);
  });
});
