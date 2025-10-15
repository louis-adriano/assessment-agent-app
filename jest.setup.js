// Jest setup file for global test configuration

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || 'test-api-key';
process.env.GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'test-github-token';

// Increase test timeout for integration tests
jest.setTimeout(30000);

// Mock console.log to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(), // Mock console.log
  // Keep other console methods for debugging
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};
