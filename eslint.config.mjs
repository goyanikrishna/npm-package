
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

const ROOT_DIR = dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  // Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      'src/database/migrations/**',
    ],
  },

  // TypeScript source and tests
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],

    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],

    languageOptions: {
      globals: {
        ...globals.node,
      },

      parserOptions: {
        projectService: true,
        tsconfigRootDir: ROOT_DIR,
      },
    },

    rules: {
      // -----------------------------------------------
      // TypeScript Safety
      // -----------------------------------------------

      '@typescript-eslint/no-explicit-any': 'error',

      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      '@typescript-eslint/no-non-null-assertion': 'error',

      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],

      '@typescript-eslint/consistent-type-exports': 'error',

      '@typescript-eslint/consistent-type-definitions': [
        'error',
        'interface',
      ],

      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],

      '@typescript-eslint/explicit-module-boundary-types': 'warn',

      // -----------------------------------------------
      // JavaScript Best Practices
      // -----------------------------------------------

      'no-var': 'error',
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-debugger': 'error',
      'no-implicit-coercion': 'error',
      'no-duplicate-imports': 'error',
      'no-unreachable': 'error',
      'no-else-return': 'error',
      'no-lonely-if': 'error',

      'no-console': [
        'warn',
        {
          allow: ['warn', 'error', 'info'],
        },
      ],

      // -----------------------------------------------
      // Maintainability
      // -----------------------------------------------

      'no-warning-comments': [
        'warn',
        {
          terms: ['todo', 'fixme', 'hack'],
          location: 'start',
        },
      ],

      'no-param-reassign': [
        'error',
        {
          props: false,
        },
      ],
    },
  },

  // Jest-specific globals
  {
    files: ['tests/**/*.ts'],

    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
]);
