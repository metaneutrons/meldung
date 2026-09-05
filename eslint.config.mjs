import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import tseslint from 'typescript-eslint';

// eslint-config-next stays: it carries the React, hooks and Next specific
// rules that a plain typescript-eslint setup does not have. On top of it the
// type-aware strict and stylistic sets of the standard, limited explicitly to
// TypeScript files so they never apply to this configuration itself.
const eslintConfig = defineConfig([
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'node_modules/**',
    'next-env.d.ts',
    '**/*.d.ts',
  ]),

  ...nextVitals,
  ...nextTs,

  ...tseslint.configs.strictTypeChecked.map((c) => ({ ...c, files: ['**/*.ts', '**/*.tsx'] })),
  ...tseslint.configs.stylisticTypeChecked.map((c) => ({ ...c, files: ['**/*.ts', '**/*.tsx'] })),

  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        // Covers files that are in no tsconfig as well.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // Promises have to be handled. Ignore deliberately through `void`.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // Numbers in template literals and string concatenation are HTTP status
      // codes, counts and percentages here. They stringify unambiguously, so
      // the strict default would only buy `String()` noise.
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/restrict-plus-operands': ['error', { allowNumberAndString: true }],

      // `||` over `??` for strings is deliberate throughout this code base: an
      // empty header, an empty environment variable and an empty trimmed value
      // are all invalid and must fall through to the next source. `??` would
      // accept the empty string and, for example, hand an empty CAPTCHA_SECRET
      // to the signature.
      '@typescript-eslint/prefer-nullish-coalescing': [
        'error',
        { ignorePrimitives: { string: true } },
      ],
    },
  },

  {
    // Relaxations exclusively for tests, never globally.
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Fetch mocks have to match an async signature without awaiting anything.
      '@typescript-eslint/require-await': 'off',
    },
  },
]);

export default eslintConfig;
