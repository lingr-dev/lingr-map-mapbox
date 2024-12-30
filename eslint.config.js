import globals from 'globals';
import { FlatCompat } from '@eslint/eslintrc';

import js from '@eslint/js';

import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

// parsers
import vueParser from 'vue-eslint-parser';

const compat = new FlatCompat({
  recommendedConfig: js.configs.recommended,
});

export default [
  js.configs.recommended,
  ...compat.extends('plugin:vue/vue3-recommended'),
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
      },
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-use-before-define': 'off',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      semi: 2,
    },
  },
  pluginPrettierRecommended,
];
