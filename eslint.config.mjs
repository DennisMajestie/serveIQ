import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {
      '@angular-eslint/prefer-on-push-component-change-detection': 'off',
      '@angular-eslint/no-output-native': 'off',
      '@angular-eslint/prefer-inject': 'off',
      '@angular-eslint/no-empty-lifecycle-method': 'off',
    },
  },
  {
    files: ['**/*.html'],
    // Disable preset-originated rules newly enabled by the angular-eslint v22
    // upgrade that are not explicitly configured by this workspace.
    rules: {
      '@angular-eslint/template/prefer-control-flow': 'off',
      '@angular-eslint/template/click-events-have-key-events': 'off',
      '@angular-eslint/template/interactive-supports-focus': 'off',
      '@angular-eslint/template/label-has-associated-control': 'off',
      '@angular-eslint/template/eqeqeq': 'off',
      '@angular-eslint/template/no-autofocus': 'off',
      '@angular-eslint/template/alt-text': 'off',
    },
  },
];
