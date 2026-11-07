import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const layer = (from, forbidden) => ({
  files: [`apps/api/src/${from}/**/*.ts`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: forbidden.map((target) => ({
          group: [`**/${target}`, `**/${target}/**`],
          message: `${from} から ${target} への依存は禁止です（ADR-0002: routes → services → repositories）`,
        })),
      },
    ],
  },
});

export default tseslint.config(
  { ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['apps/api/**/*.ts', '**/*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  // レイヤーの依存方向（ADR-0002「確認方法」）
  layer('routes', ['repositories']),
  layer('services', ['routes']),
  layer('repositories', ['routes', 'services']),
  layer('lib', ['routes', 'services', 'repositories']),
  prettier,
);
