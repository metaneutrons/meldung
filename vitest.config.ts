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
      // 2026-09-06: 43.15 lines, 42.03 statements, 36.84 functions, 40.48
      // branches. The floor sits just under that, so a regression fails while
      // the current state passes. Raise it when coverage rises; never lower it
      // to make a run pass.
      thresholds: {
        lines: 40,
        functions: 35,
        statements: 40,
        branches: 35,
      },
    },
  },
});
