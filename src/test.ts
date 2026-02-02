// src/test.ts
import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
import { server } from './mocks/server';

declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): {
    keys(): string[];
    <T>(id: string): T;
  };
};

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
  console.log('[MSW] Server listening');
});

// Reset handlers after each test for isolation
afterEach(() => {
  server.resetHandlers();
});

// Stop server after all tests
afterAll(() => {
  server.close();
  console.log('[MSW] Server closed');
});

// Initialize Angular testing environment
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

// Load all spec files
const context = require.context('./', true, /\.spec\.ts$/);
context.keys().forEach(context);
