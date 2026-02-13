import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '.',
    include: ['test/**/*.test.js'],
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['agent/**', 'migration/**', 'discovery/**', 'lib/**', 'srv/**', 'extraction/**'],
    },
  },
});
