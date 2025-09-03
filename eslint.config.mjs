import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Global ignores that apply to all rules
  {
    ignores: [
      '**/.angular/**',
      '**/dist/**',
      '**/.bob/**',
      '**/node_modules/**'
    ]
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.eslint.json',
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended
    ],
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      // Base ESLint rules
      'array-bracket-spacing': [
        'error',
        'never'
      ],
      'arrow-parens': [
        'error',
        'as-needed'
      ],
      'arrow-spacing': [
        'error',
        {
          before: true,
          after: true
        }
      ],
      'block-spacing': [
        'error',
        'always'
      ],
      'comma-dangle': 'error',
      'comma-style': [
        'error',
        'last'
      ],
      'computed-property-spacing': [
        'error',
        'never'
      ],
      'curly': [
        'error',
        'multi-line',
        'consistent'
      ],
      'default-case': 'error',
      'dot-location': [
        'error',
        'property'
      ],
      'dot-notation': [
        'error',
        {
          allowKeywords: true
        }
      ],
      'eol-last': 'error',
      'eqeqeq': [
        'error',
        'always'
      ],
      'generator-star-spacing': [
        'error',
        {
          before: true,
          after: true
        }
      ],
      'handle-callback-err': [
        'error',
        '^(err|error)$'
      ],
      'key-spacing': [
        'error',
        {
          beforeColon: false,
          afterColon: true
        }
      ],
      'keyword-spacing': [
        'error',
        {
          before: true,
          after: true
        }
      ],
      'lines-between-class-members': [
        'error',
        'always',
        {
          exceptAfterSingleLine: true
        }
      ],
      'max-len': [
        'error',
        {
          code: 220,
          ignorePattern: '^import \\{.*\\} from.*$',
          ignoreStrings: true,
          ignoreTemplateLiterals: true
        }
      ],
      'new-cap': [
        'error',
        {
          newIsCap: true,
          capIsNew: false,
          properties: true
        }
      ],
      'new-parens': 'error',
      'no-bitwise': 'error',
      'no-caller': 'error',
      'no-console': 'warn',
      'no-constant-condition': 'warn',
      'no-eval': 'error',
      'no-extend-native': 'error',
      'no-extra-bind': 'error',
      'no-floating-decimal': 'error',
      'no-implied-eval': 'error',
      'no-inner-declarations': [
        'error',
        'functions'
      ],
      'no-iterator': 'error',
      'no-labels': [
        'error',
        {
          allowLoop: false,
          allowSwitch: false
        }
      ],
      'no-lone-blocks': 'error',
      'no-mixed-operators': 'error',
      'no-multi-assign': 'error',
      'no-multi-spaces': 'error',
      'no-multi-str': 'error',
      'no-multiple-empty-lines': [
        'error',
        {
          max: 1,
          maxBOF: 0,
          maxEOF: 0
        }
      ],
      'no-negated-in-lhs': 'error',
      'no-new': 'error',
      'no-new-func': 'error',
      'no-new-object': 'error',
      'no-new-require': 'error',
      'no-new-wrappers': 'error',
      'no-octal-escape': 'error',
      'no-path-concat': 'error',
      'no-proto': 'error',
      'no-return-assign': [
        'error',
        'except-parens'
      ],
      'no-self-assign': [
        'error',
        {
          props: true
        }
      ],
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-tabs': 'error',
      'no-template-curly-in-string': 'error',
      'no-trailing-spaces': 'error',
      'no-undef-init': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unneeded-ternary': [
        'error',
        {
          defaultAssignment: false
        }
      ],
      'no-useless-call': 'error',
      'no-useless-computed-key': 'error',
      'no-useless-rename': 'error',
      'no-useless-return': 'error',
      'no-var': 'error',
      'no-whitespace-before-property': 'error',
      'object-curly-newline': [
        'error',
        {
          multiline: true,
          consistent: true
        }
      ],
      'object-curly-spacing': [
        'error',
        'always'
      ],
      'object-property-newline': [
        'error',
        {
          allowMultiplePropertiesPerLine: true
        }
      ],
      'one-var': [
        'error',
        {
          initialized: 'never'
        }
      ],
      'operator-linebreak': [
        'error',
        'after',
        {
          overrides: {
            '?': 'before',
            ':': 'before',
            '|>': 'before'
          }
        }
      ],
      'padded-blocks': [
        'error',
        {
          blocks: 'never',
          switches: 'never',
          classes: 'never'
        }
      ],
      'padding-line-between-statements': [
        "error",
        { blankLine: 'always', prev: 'import', next: '*' },
        { blankLine: "any", prev: "import", next: "import" }
      ],
      'prefer-const': [
        'error',
        {
          destructuring: 'all'
        }
      ],
      'prefer-promise-reject-errors': 'error',
      'quote-props': [
        'error',
        'consistent-as-needed'
      ],
      'rest-spread-spacing': [
        'error',
        'never'
      ],
      'semi-spacing': [
        'error',
        {
          before: false,
          after: true
        }
      ],
      'space-before-blocks': [
        'error',
        'always'
      ],
      'space-in-parens': [
        'error',
        'never'
      ],
      'space-infix-ops': 'error',
      'space-unary-ops': [
        'error',
        {
          words: true,
          nonwords: false
        }
      ],
      'spaced-comment': ["error", "always", {
        "line": {
          "markers": ["/"],
          "exceptions": ["-", "+"]
        },
        "block": {
          "markers": ["!"],
          "exceptions": ["*", "/**"],
          "balanced": true
        }
      }],
      'symbol-description': 'error',
      'template-curly-spacing': [
        'error',
        'never'
      ],
      'template-tag-spacing': [
        'error',
        'never'
      ],
      'unicode-bom': [
        'error',
        'never'
      ],
      'valid-typeof': [
        'error',
        {
          requireStringLiterals: true
        }
      ],
      'wrap-iife': [
        'error',
        'any',
        {
          functionPrototypeMethods: true
        }
      ],
      'yield-star-spacing': [
        'error',
        'both'
      ],
      'yoda': [
        'error',
        'never'
      ],

      // TypeScript rules
      '@typescript-eslint/array-type': [
        'error',
        {
          default: 'generic'
        }
      ],
      '@stylistic/brace-style': 'error',
      '@typescript-eslint/class-literal-property-style': 'error',
      '@stylistic/comma-spacing': 'error',
      '@typescript-eslint/consistent-type-definitions': [
        'error',
        'interface'
      ],
      '@typescript-eslint/default-param-last': 'error',
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true
        }
      ],
      '@typescript-eslint/explicit-member-accessibility': 'error',
      '@typescript-eslint/explicit-module-boundary-types': ['error', {
        allowArgumentsExplicitlyTypedAsAny: true
      }],
      '@stylistic/function-call-spacing': 'error',
      '@stylistic/member-delimiter-style': 'error',
      '@typescript-eslint/no-dupe-class-members': 'error',
      '@typescript-eslint/only-throw-error': 'error',
      '@typescript-eslint/no-extra-non-null-assertion': 'error',
      '@stylistic/no-extra-semi': 'error',
      '@typescript-eslint/no-for-in-array': 'error',
      '@typescript-eslint/no-implied-eval': 'error',
      '@typescript-eslint/no-misused-new': 'error',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
      '@typescript-eslint/parameter-properties': [
        'error',
        {
          allow: [
            'private readonly',
            'protected readonly',
            'public readonly'
          ]
        }
      ],
      '@typescript-eslint/no-redeclare': 'error',
      '@typescript-eslint/no-this-alias': [
        'error',
        {
          allowDestructuring: true
        }
      ],
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unnecessary-qualifier': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/no-useless-constructor': 'error',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/prefer-function-type': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-regexp-exec': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@stylistic/quotes': [
        'error',
        'single'
      ],
      '@typescript-eslint/require-array-sort-compare': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/return-await': 'error',
      '@stylistic/semi': 'error',
      '@stylistic/space-before-function-paren': [
        'error',
        {
          anonymous: 'always',
          asyncArrow: 'always',
          named: 'never'
        }
      ],
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowNullableObject: true,
          allowNullableBoolean: true
        }
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/unbound-method': [
        'error',
        {
          ignoreStatic: true
        }
      ],

      // Slow rules - disabled
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-deprecated': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unnecessary-type-arguments': 'off',

      // Rules that are turned off because they're handled by other rules or not needed
      'brace-style': 'off',
      'comma-spacing': 'off',
      'default-param-last': 'off',
      'function-call-spacing': 'off',
      'indent': 'off',
      'no-dupe-class-members': 'off',
      'no-extra-parens': 'off',
      'no-extra-semi': 'off',
      'no-redeclare': 'off',
      'no-return-await': 'off',
      'no-undef': 'off',
      'no-unused-expressions': 'off',
      'no-unused-vars': 'off',
      'no-use-before-define': 'off',
      'no-useless-constructor': 'off',
      'no-void': 'off',
      'quotes': 'off',
      'require-await': 'off',
      'semi': 'off',
      'space-before-function-paren': 'off',
      '@typescript-eslint/camelcase': 'off',
      '@typescript-eslint/indent': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-extra-parens': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-use-before-define': 'off'
    }
  },
  // Test files configuration
  {
    files: [
      'packages/*/tests/**/*.{ts,tsx}',
      'integration/**/*.{ts,tsx}'
    ],
    // ignores: ['**/dist/**', '**/node_modules/**']
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off'
    }
  },

  // React specific configuration
  {
    files: [
      'packages/react/**/*.{ts,tsx}',
      'integration/react/**/*.{ts,tsx}'
    ],
    settings: {
      react: {
        version: 'detect'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin
    },
    extends: [
      react.configs.flat['jsx-runtime'],
      reactHooks.configs['recommended-latest']
    ],
    rules: {
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off'
    }
  },

  // Docs configuration
  {
    files: [
      'docs/src/**/*.{ts,tsx}'
    ],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off'
    }
  }
);
