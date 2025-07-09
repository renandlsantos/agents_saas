/**
 * Stub for node:net module
 * This file replaces the Node.js net module in Edge Runtime environments
 */

export class Socket {
  constructor() {}
  
  connect() {
    throw new Error('Node.js net module not available in Edge Runtime');
  }
  
  write() {
    throw new Error('Node.js net module not available in Edge Runtime');
  }
  
  end() {}
  destroy() {}
  on() {}
  off() {}
}

export class Server {
  constructor() {}
  
  listen() {
    throw new Error('Node.js net module not available in Edge Runtime');
  }
  
  close() {}
  on() {}
  off() {}
}

export function createConnection() {
  throw new Error('Node.js net module not available in Edge Runtime');
}

export function createServer() {
  throw new Error('Node.js net module not available in Edge Runtime');
}

export default {
  Server,
  Socket,
  createConnection,
  createServer,
};