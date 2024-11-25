module.exports = {
    parser: 'vue-eslint-parser',
    root: true,
    env: {
        node: true,
    },
    extends: ['eslint:recommended', 'plugin:vue/vue3-recommended', '@vue/prettier'],
    parserOptions: {
        ecmaVersion: 2020,
        ecmaFeatures: {
            jsx: false,
        },
    },
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-use-before-define': 'off',
        'prettier/prettier': ['error', {endOfLine: 'auto'}],
        semi: 2,
    },
    overrides: [
        {
            files: ['**/__tests__/*.{j,t}s', '**/tests/unit/**/*.spec.{j,t}s'],
            env: {
                jest: true,
            },
        },
    ],
};
