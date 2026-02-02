// src/setup-jest.ts
import 'jest-preset-angular/setup-jest';

// Import MSW server
import { server } from './mocks/server';

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
  console.log('[MSW] Server started');
});

// Reset any request handlers that are declared as a part of tests
afterEach(() => {
  server.resetHandlers();
});

// Clean up after all tests are done
afterAll(() => {
  server.close();
  console.log('[MSW] Server closed');
});

// Increase timeout for async tests
jest.setTimeout(10000);
