import globals from 'globals'
import js from '@eslint/js'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tseslint from 'typescript-eslint'

export default [
  { ignores: ['dist', 'eslint.config.js', 'vite.config.js'] },

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      parser: tsParser,
      globals: globals.browser,
      ...jsxA11y.flatConfigs.recommended.languageOptions,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      '@typescript-eslint': tsPlugin,
      '@typescript-eslint/stylistic': tsPlugin,
      '@typescript-eslint/strict-type-checked': tsPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/jsx-no-target-blank': [
        'warn',
        { enforceDynamicLinks: 'always', warnOnSpreadAttributes: true, forms: true },
      ],
      'react/boolean-prop-naming': ['error', { validateNested: true }],
      'react/button-has-type': 'warn',
      // 'react/forbid-dom-props': ['warn', { forbid: ['style', 'align', 'bgcolor', 'border'] }],
      // 'react/forbid-foreign-prop-types': ['warn', { allowInPropTypes: false }],
      'react/forward-ref-uses-ref': 'error',
      'react/jsx-boolean-value': 'warn',
      // 'react/jsx-closing-bracket-location': [
      //   'warn',
      //   {
      //     nonEmpty: 'tag-aligned',
      //     selfClosing: 'line-aligned',
      //   },
      // ],
      // 'react/jsx-closing-tag-location': 'warn',
      'react/jsx-curly-brace-presence': ['warn', 'never'],
      // 'react/jsx-curly-newline': ['warn', 'consistent'],
      // 'react/jsx-curly-spacing': [
      //   'warn',
      //   {
      //     when: 'never',
      //     allowMultiline: true,
      //     children: true,
      //     spacing: {
      //       objectLiterals: 'never',
      //     },
      //   },
      // ],
      // 'react/jsx-filename-extension': [
      //   'warn',
      //   { allow: 'as-needed', ignoreFilesWithoutCode: true, extensions: ['.jsx', '.tsx'] },
      // ],
      // 'react/jsx-first-prop-new-line': ['warn', 'multiline-multiprop'],
      'react/jsx-fragments': ['warn', 'syntax'],
      'react/jsx-handler-names': [
        'warn',
        {
          checkLocalVariables: true,
        },
      ],
      // 'react/jsx-indent': ['warn', 2],
      // 'react/jsx-indent-props': ['warn', 2],
      'react/jsx-key': [
        'warn',
        { checkFragmentShorthand: true, checkKeyMustBeforeSpread: true, warnOnDuplicates: true },
      ],
      // 'react/jsx-max-props-per-line': ['warn', { maximum: { single: 5, multi: 1 } }],
      'react/jsx-newline': [
        'warn',
        {
          prevent: true,
          allowMultilines: true,
        },
      ],
      'react/jsx-no-script-url': [
        'error',
        [
          {
            name: 'Link',
            props: ['to'],
          },
        ],
      ],
      'react/jsx-no-useless-fragment': [
        'warn',
        {
          allowExpressions: true,
        },
      ],
      // 'react/jsx-pascal-case': 'warn',
      // 'react/jsx-props-no-multi-spaces': 'warn',
      'react/jsx-props-no-spread-multi': 'warn',
      // 'react/jsx-sort-props': [
      //   'warn',
      //   {
      //     callbacksLast: true,
      //     shorthandLast: true,
      //     noSortAlphabetically: true,
      //   },
      // ],
      // 'react/jsx-tag-spacing': ['warn', { beforeSelfClosing: 'always', beforeClosing: 'never' }],
      // 'react/jsx-wrap-multilines': [
      //   'warn',
      //   {
      //     declaration: 'parens-new-line',
      //     assignment: 'parens-new-line',
      //     return: 'parens-new-line',
      //     arrow: 'parens-new-line',
      //     condition: 'parens-new-line',
      //   },
      // ],
      'react/no-access-state-in-setstate': 'error',
      'react/no-adjacent-inline-elements': 'warn',
      'react/no-danger': [
        'error',
        {
          customComponentNames: ['*'],
        },
      ],
      'react/no-did-mount-set-state': ['warn', 'disallow-in-func'],
      'react/no-did-update-set-state': ['warn', 'disallow-in-func'],
      'react/no-invalid-html-attribute': 'error',
      // 'react/no-multi-comp': ['warn', { ignoreStateless: true }],
      'react/no-namespace': 'warn',
      'react/no-object-type-as-default-prop': 'warn',
      'react/no-redundant-should-component-update': 'error',
      'react/no-will-update-set-state': 'warn',
      'react/no-this-in-sfc': 'error',
      'react/no-typos': 'error',
      'react/no-unsafe': 'warn',
      'react/no-unstable-nested-components': 'warn',
      'react/no-unused-class-component-methods': ['warn'],
      'react/no-unused-prop-types': ['warn'],
      'react/no-unused-state': 'warn',
      'react/prefer-exact-props': 'warn',
      // 'react/prefer-read-only-props': 'warn',
      'react/prefer-stateless-function': ['warn', { ignorePureComponents: true }],
      // 'react/self-closing-comp': [
      //   'error',
      //   {
      //     component: true,
      //     html: true,
      //   },
      // ],
      // 'react/sort-comp': 'warn',
      'react/style-prop-object': 'warn',
      'react/void-dom-elements-no-children': 'error',
      // 'react/prefer-es6-class': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/checked-requires-onchange-or-readonly': [
        'warn',
        {
          ignoreMissingProperties: true,
          ignoreExclusiveCheckedAttribute: false,
        },
      ],
      'react/destructuring-assignment': [
        'warn',
        'always',
        { ignoreClassFields: false, destructureInSignature: 'always' },
      ],
      'react/forbid-prop-types': 'warn',
      'react/jsx-no-constructed-context-values': 'warn',
      'react/no-arrow-function-lifecycle': 'error',
      'react/jsx-no-leaked-render': 'warn', //
      // 'react/jsx-no-bind': [
      //   //
      //   'warn',
      //   {
      //     ignoreRefs: false,
      //     allowArrowFunctions: true,
      //     allowFunctions: true,
      //   },
      // ],

      // a11y
      'jsx-a11y/alt-text': [
        'error',
        {
          elements: ['img', 'object', 'area', 'input[type="image"]'],
          img: ['Image', 'Icon', 'CustomImage'],
          object: ['Object'],
          area: ['Area'],
          'input[type="image"]': ['InputImage'],
        },
      ],
      'jsx-a11y/control-has-associated-label': 'warn',
      'jsx-a11y/img-redundant-alt': 'warn',
      // 'jsx-a11y/lang': 'error',
      'jsx-a11y/no-autofocus': 0,
      // 'jsx-a11y/no-distracting-elements': 'warn',
      // 'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/prefer-tag-over-role': 'error',

      //JS
      eqeqeq: ['error', 'always'],
      // quotes: ['warn', 'single'],
      // camelcase: ['error', { ignoreImports: true }],
      curly: ['error', 'multi-line'],
      'for-direction': 'error',
      'no-class-assign': 'error',
      'no-compare-neg-zero': 'error',
      'no-cond-assign': 'error',
      'no-duplicate-imports': 'error',
      'no-dupe-keys': 'error',
      'no-invalid-regexp': 'error',
      'no-self-compare': 'error',
      'no-unreachable': 'error',
      'no-unused-vars': 'error',
      'no-console': 'warn',
      'no-var': 'error',
      'prefer-const': 'error',
      // 'sort-imports': [
      //   'warn',
      //   {
      //     ignoreCase: false,
      //     ignoreDeclarationSort: false,
      //     ignoreMemberSort: false,
      //     memberSyntaxSortOrder: ['all', 'multiple', 'single', 'none'],
      //     allowSeparatedGroups: false,
      //   },
      // ],
      // 'sort-vars': 'error',
      // 'vars-on-top': 'error',

      //TS
      // '@typescript-eslint/array-type': 'warn',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/consistent-generic-constructors': 'warn',
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowFunctionsWithoutTypeParameters: true,
        },
      ],
      // '@typescript-eslint/init-declarations': 'warn',
      '@typescript-eslint/no-base-to-string': 'warn',
      '@typescript-eslint/no-confusing-non-null-assertion': 'error',
      '@typescript-eslint/no-confusing-void-expression': 'error',
      // '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      '@typescript-eslint/no-dupe-class-members': 'error',
      '@typescript-eslint/no-duplicate-enum-values': 'warn',
      '@typescript-eslint/no-duplicate-type-constituents': 'error',
      '@typescript-eslint/no-dynamic-delete': 'warn',
      '@typescript-eslint/no-empty-interface': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-extra-non-null-assertion': 'error',
      '@typescript-eslint/no-extraneous-class': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-for-in-array': 'warn',
      '@typescript-eslint/no-implied-eval': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'warn',
      '@typescript-eslint/no-meaningless-void-operator': 'error',
      // '@typescript-eslint/no-mixed-enums': 'warn',
      '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unnecessary-parameter-property-assignment': 'error',
      '@typescript-eslint/no-unnecessary-qualifier': 'error',
      '@typescript-eslint/no-unnecessary-template-expression': 'error',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-enum-comparison': 'error',
      '@typescript-eslint/no-unsafe-function-type': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-unary-minus': 'error',
      '@typescript-eslint/no-useless-empty-export': 'error',
      '@typescript-eslint/no-wrapper-object-types': 'warn',
      '@typescript-eslint/prefer-enum-initializers': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/prefer-for-of': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/unified-signatures': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksSpreads: true,
          checksConditionals: true,
          checksVoidReturn: false,
        },
      ],
      // '@typescript-eslint/max-params': [
      //   'warn',
      //   {
      //     countVoidThis: true,
      //     max: 5,
      //   },
      // ],
      '@typescript-eslint/consistent-type-exports': [
        'warn',
        {
          fixMixedExportsWithInlineTypeSpecifier: true,
        },
      ],
      // '@typescript-eslint/naming-convention': [
      //   'error',
      //   {
      //     selector: 'default',
      //     format: ['camelCase', 'PascalCase'],
      //   },
      //   {
      //     selector: 'variable',
      //     format: ['camelCase', 'UPPER_CASE'],
      //     leadingUnderscore: 'allow',
      //   },
      //   {
      //     selector: 'variable',
      //     modifiers: ['const'],
      //     types: ['boolean', 'string', 'number', 'array'],
      //     format: ['UPPER_CASE'],
      //   },
      //   {
      //     selector: 'variable',
      //     format: ['camelCase', 'UPPER_CASE'],
      //     modifiers: ['const'],
      //     filter: {
      //       regex: '^[A-Z]',
      //       match: false,
      //     },
      //   },
      //   {
      //     selector: 'variable',
      //     modifiers: ['const'],
      //     types: ['function'],
      //     format: ['camelCase', 'PascalCase'],
      //   },
      //   {
      //     selector: 'function',
      //     format: ['camelCase'],
      //   },
      //   {
      //     selector: 'typeLike',
      //     format: ['PascalCase'],
      //   },
      //   {
      //     selector: 'variable',
      //     modifiers: ['const'],
      //     format: ['camelCase', 'PascalCase'],
      //     filter: {
      //       regex: '^use[A-Z]|^is|^set[A-Z]',
      //       match: true,
      //     },
      //   },
      //   {
      //     selector: 'objectLiteralProperty',
      //     format: null,
      //   },
      // ],
    },
  },
]
