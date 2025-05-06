import fs from 'node:fs';
import process from 'node:process';
import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import js from '@eslint/js';

import pluginVue from 'eslint-plugin-vue';
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

// parsers
import vueParser from 'vue-eslint-parser';

const autoImportRc = JSON.parse(fs.readFileSync('./apps/map-mapbox/.eslintrc-auto-import.json'));

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaVersion: 2020,
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...autoImportRc.globals,
      },
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-use-before-define': 'off',
      'vue/multi-word-component-names': 'off',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      semi: 2,
    },
  },
  {
    files: ['**/*.ts'],

    languageOptions: {
      parser: tsparser,
      sourceType: 'module',
    },

    plugins: {
      '@typescript-eslint': tseslint,
    },

    ignores: ['.node_modules/*', 'vite-env.d.ts'],

    rules: {
      ...tseslint.configs.recommended.rules,
      ...pluginPrettierRecommended.rules,
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
      semi: ['error', 'always'],
      quotes: ['error', 'double'],
      'prettier/prettier': 'error',
    },
  },
  pluginPrettierRecommended,
];
