import { defineConfig } from 'vite-plus';

export default defineConfig({
  lint: {
    ignorePatterns: ['dist/**', 'coverage/**'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    singleQuote: true,
    ignorePatterns: ['docs/**', '*.md', 'pnpm-lock.yaml'],
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
