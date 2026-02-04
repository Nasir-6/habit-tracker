//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  {
    ignores: ['**/*.config.js', 'eslint.config.js', 'prettier.config.js'],
  },
  ...tanstackConfig,
  {
    rules: {
      '@typescript-eslint/array-type': [
        'error',
        { default: 'array', readonly: 'array' },
      ],
    },
  },
]
