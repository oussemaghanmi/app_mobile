import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';

// Classes Tailwind directionnelles interdites (cassent le RTL arabe / darija)
const RTL_PATTERN =
  '/(^|\\s)-?((ml|mr|pl|pr|left|right|border-l|border-r|rounded-l|rounded-r|scroll-ml|scroll-mr)-|text-left\\b|text-right\\b)/';
const RTL_MESSAGE =
  'RTL : utiliser les propriétés logiques (ms-, me-, ps-, pe-, start-, end-, border-s, text-start).';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'android',
      'ios',
      'coverage',
      'src/lib/database.types.ts',
      'src/figma',
      'supabase/functions',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, jsxA11y.flatConfigs.recommended],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Convention : aucun accès Supabase direct dans les composants → passer par features/<nom>/api.ts
      'no-restricted-imports': [
        'error',
        { paths: [{ name: '@/lib/supabase', message: 'Passer par src/features/<nom>/api.ts.' }] },
      ],
      // RTL : propriétés logiques uniquement (ms-/me-/ps-/pe-/start-/end-)
      'no-restricted-syntax': [
        'error',
        {
          selector: `Literal[value=${RTL_PATTERN}]`,
          message: RTL_MESSAGE,
        },
        {
          selector: `TemplateElement[value.raw=${RTL_PATTERN}]`,
          message: RTL_MESSAGE,
        },
      ],
    },
  },
  {
    files: ['src/features/*/api.ts', 'src/lib/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['scripts/**/*.mjs', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
