module.exports = {
  extends: ['eslint:recommended', 'react-app', 'prettier/@typescript-eslint', 'plugin:prettier/recommended'],
  plugins: ['simple-import-sort'],
  rules: {
    'no-shadow': 'error',
    'react/self-closing-comp': ['error', { component: true, html: true }],
    'react/jsx-boolean-value': 'error',
    '@typescript-eslint/explicit-member-accessibility': 'error',
    'simple-import-sort/imports': 'error',
    'import/first': 'warn',
    'import/newline-after-import': 'warn',
    'import/no-duplicates': 'warn',
    'import/no-webpack-loader-syntax': 'warn',
  },
  settings: {
    react: {
      version: '999.999.999',
    },
  },
}
