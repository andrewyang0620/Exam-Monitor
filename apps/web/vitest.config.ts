import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@tcf-tracker/types': resolve(__dirname, '../../packages/types/src/index.ts'),
      '@tcf-tracker/utils': resolve(__dirname, '../../packages/utils/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
  },
})
