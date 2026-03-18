module.exports = [
  {
    ignores: [
      'node_modules/**',
      '.env*',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.log',
      '.vscode/**',
      '.idea/**',
      '.DS_Store',
      'logs/**',
    ],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        setImmediate: 'readonly',
        setInterval: 'readonly',
        setTimeout: 'readonly',
      },
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
      'no-var': 'error',
      'prefer-const': 'error',

      // Best practices
      eqeqeq: ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-with': 'error',
      'no-multi-spaces': 'error',

      // Spacing & formatting
      'keyword-spacing': 'error',
      'space-before-blocks': 'error',
      'space-infix-ops': 'error',
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],

      // Arrow functions
      'arrow-spacing': 'error',
      'arrow-parens': ['error', 'always'],
    },
  },
];
