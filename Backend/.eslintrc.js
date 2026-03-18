module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Error prevention
    'no-console': ['warn', { allow: ['error', 'warn'] }],
    'no-debugger': 'warn',
    'no-unused-vars': 'warn',
    'no-duplicate-imports': 'error',

    // Code style
    semi: ['error', 'always'],
    quotes: ['error', 'single', { avoidEscape: true }],
    indent: ['error', 2],
    'comma-dangle': ['error', 'es5'],
    'no-var': 'error',
    'prefer-const': 'error',

    // Best practices
    eqeqeq: ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-with': 'error',
    'no-multi-spaces': 'error',

    // Spacing
    'keyword-spacing': 'error',
    'space-before-blocks': 'error',
    'space-infix-ops': 'error',
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],

    // Arrow functions
    'arrow-spacing': 'error',
    'arrow-parens': ['error', 'always'],

    // Function naming
    'func-names': ['warn', 'as-needed'],
    'no-parameter-reassign': 'warn',
  },
};
