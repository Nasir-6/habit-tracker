//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import typescriptEslint from '@typescript-eslint/eslint-plugin'

export default [
  {
    ignores: [
      '**/*.config.js',
      'eslint.config.js',
      'prettier.config.js',
      'public/sw.js',
      '.output/**',
      '.netlify/**',
    ],
  },
  ...tanstackConfig,
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      '@typescript-eslint/array-type': [
        'error',
        { default: 'array', readonly: 'array' },
      ],
    },
  },
]
