/**
 * Stub for node:path module
 * This file provides a minimal implementation for web/Edge Runtime environments
 */

export const sep = '/';
export const delimiter = ':';

export function join(...paths: string[]): string {
  return paths.filter(Boolean).join('/').replaceAll(/\/+/g, '/');
}

export function resolve(...paths: string[]): string {
  return '/' + join(...paths).replace(/^\/+/, '');
}

export function basename(path: string, ext?: string): string {
  const base = path.split('/').pop() || '';
  if (ext && base.endsWith(ext)) {
    return base.slice(0, -ext.length);
  }
  return base;
}

export function dirname(path: string): string {
  const parts = path.split('/');
  parts.pop();
  return parts.join('/') || '/';
}

export function extname(path: string): string {
  const base = basename(path);
  const lastDot = base.lastIndexOf('.');
  if (lastDot === -1) return '';
  return base.slice(lastDot);
}

export function relative(from: string, to: string): string {
  // Simple implementation
  if (to.startsWith(from)) {
    return to.slice(from.length).replace(/^\//, '');
  }
  return to;
}

export function isAbsolute(path: string): boolean {
  return path.startsWith('/');
}

export function normalize(path: string): string {
  return resolve(path);
}

export function parse(path: string) {
  const dir = dirname(path);
  const base = basename(path);
  const ext = extname(path);
  const name = base.slice(0, base.length - ext.length);

  return {
    base,
    dir,
    ext,
    name,
    root: path.startsWith('/') ? '/' : '',
  };
}

export function format(pathObject: any): string {
  const { dir = '', name = '', ext = '' } = pathObject;
  return join(dir, name + ext);
}

export default {
  basename,
  delimiter,
  dirname,
  extname,
  format,
  isAbsolute,
  join,
  normalize,
  parse,
  relative,
  resolve,
  sep,
};
