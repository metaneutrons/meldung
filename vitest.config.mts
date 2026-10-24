import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Vite resolves the tsconfig `paths` (the `@/` alias) itself, so the
  // vite-tsconfig-paths plugin is no longer needed.
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**/*.ts', 'src/i18n/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.d.ts'],
      // A hard floor, not a dashboard. The run fails below it. Measured on
      // 2026-10-24 with Vitest 5, which counts fewer functions and statements
      // than Vitest 4 did: 59.96 statements, 58.30 branches, 61.34 functions,
      // 60.49 lines. The floor sits just under that, so a regression fails
      // while the current state passes. Raise it when coverage rises; never
      // lower it to make a run pass.
      thresholds: {
        lines: 58,
        functions: 58,
        statements: 58,
        branches: 56,
      },
    },
  },
});
