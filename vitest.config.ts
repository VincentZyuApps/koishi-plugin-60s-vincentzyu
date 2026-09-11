import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      koishi: path.resolve(__dirname, 'test/mocks/koishi.ts'),
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
  },
})
