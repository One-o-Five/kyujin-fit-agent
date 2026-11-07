import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  target: 'node22',
  clean: true,
  // workspace のパッケージは TypeScript のソースを直接公開しているため、バンドルに含める
  noExternal: [/^@kyujin\//],
});
