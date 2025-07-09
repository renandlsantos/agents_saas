/**
 * Stub for node:os module
 * This file replaces the Node.js os module in Edge Runtime environments
 */

export function tmpdir() {
  return '/tmp';
}

export function homedir() {
  return '/home/user';
}

export function platform() {
  return 'linux';
}

export function arch() {
  return 'x64';
}

export function release() {
  return '5.0.0';
}

export function type() {
  return 'Linux';
}

export function hostname() {
  return 'localhost';
}

export function cpus() {
  return [];
}

export function totalmem() {
  return 0;
}

export function freemem() {
  return 0;
}

export function userInfo() {
  return {
    gid: -1,
    homedir: '/home/user',
    shell: null,
    uid: -1,
    username: 'user',
  };
}

export const EOL = '\n';

export default {
  EOL,
  arch,
  cpus,
  freemem,
  homedir,
  hostname,
  platform,
  release,
  tmpdir,
  totalmem,
  type,
  userInfo,
};