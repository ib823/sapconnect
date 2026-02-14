const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
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
