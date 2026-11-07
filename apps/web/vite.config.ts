import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// 本番は CloudFront で /api/* をAPIに振り分ける（docs/architecture.md）。
// 開発時も同一オリジンにそろえるため、Vite のプロキシで /api を転送する。
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
});
