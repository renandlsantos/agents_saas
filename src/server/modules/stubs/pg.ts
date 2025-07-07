/**
 * Stub for pg module
 * This file replaces the pg module in web/Edge Runtime environments
 */

export class Client {
  connect(): Promise<void> {
    throw new Error('PostgreSQL client not available in web environment');
  }

  query(): Promise<any> {
    throw new Error('PostgreSQL client not available in web environment');
  }

  end(): Promise<void> {
    throw new Error('PostgreSQL client not available in web environment');
  }
}

export class Pool {
  connect(): Promise<any> {
    throw new Error('PostgreSQL pool not available in web environment');
  }

  query(): Promise<any> {
    throw new Error('PostgreSQL pool not available in web environment');
  }

  end(): Promise<void> {
    throw new Error('PostgreSQL pool not available in web environment');
  }
}

export default {
  Client,
  Pool,
};
