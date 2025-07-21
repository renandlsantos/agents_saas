/// <reference types="vitest" />

import type {
  describe as vitestDescribe,
  it as vitestIt,
  test as vitestTest,
  expect as vitestExpect,
  vi as vitestVi,
  beforeAll as vitestBeforeAll,
  afterAll as vitestAfterAll,
  beforeEach as vitestBeforeEach,
  afterEach as vitestAfterEach,
} from 'vitest';

declare global {
  const describe: typeof vitestDescribe;
  const it: typeof vitestIt;
  const test: typeof vitestTest;
  const expect: typeof vitestExpect;
  const vi: typeof vitestVi;
  const beforeAll: typeof vitestBeforeAll;
  const afterAll: typeof vitestAfterAll;
  const beforeEach: typeof vitestBeforeEach;
  const afterEach: typeof vitestAfterEach;
}