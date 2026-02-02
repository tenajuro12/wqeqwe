// src/jest-polyfills.ts
// Polyfills for MSW v1.x in Jest environment

import { TextEncoder, TextDecoder } from 'util';

// Add TextEncoder/TextDecoder (required for some MSW operations)
Object.assign(global, { TextEncoder, TextDecoder });

// whatwg-fetch polyfill for MSW v1.x
require('whatwg-fetch');

export {};
