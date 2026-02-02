// src/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Create MSW server for Node/Jest environment
export const server = setupServer(...handlers);

// Re-export handlers for use in tests
export { handlers };
