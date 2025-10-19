import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['testing/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.ts'],
    setupFiles: [],
    coverage: {
      reporter: ['text', 'html'],
    },
    assetsInclude: ['**/*.html'],
  },
  resolve: {
    alias: {
      'cloudflare:workflows': path.resolve(__dirname, 'testing/mocks/cloudflare-workflows.ts'),
    },
  },
});
