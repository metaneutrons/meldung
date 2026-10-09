import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**/*.ts', 'src/i18n/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.d.ts'],
      // A hard floor, not a dashboard. The run fails below it. Measured on
      // 2026-10-10: 59.67 statements, 57.97 branches, 59.84 functions, 60.12
      // lines. The floor sits just under that, so a regression fails while
      // the current state passes. Raise it when coverage rises; never lower it
      // to make a run pass.
      thresholds: {
        lines: 58,
        functions: 58,
        statements: 58,
        branches: 56,
      },
    },
  },
});
