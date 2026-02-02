// jest.config.js
module.exports = {
  preset: 'jest-preset-angular',
  setupFiles: ['<rootDir>/src/jest-polyfills.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', 'src/test.ts'],
  moduleNameMapper: {
    '@app/(.*)': '<rootDir>/src/app/$1',
    '@mocks/(.*)': '<rootDir>/src/mocks/$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@angular|@ngrx|rxjs)/)'
  ],
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$'
      }
    ]
  }
};
