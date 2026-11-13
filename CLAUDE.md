# CLAUDE.md

このリポジトリで Claude Code が作業する際の前提とルール。

## プロジェクト

日本の求人票に特化した、求人票と職務経歴書のマッチング分析サービス。詳細は `README.md` と `docs/` を参照。
設計判断は `docs/adr/` にある。既存の ADR と矛盾する変更をする場合は、先に ADR の追加・更新を提案すること。

## 構成

pnpm workspace のモノレポ。

- `apps/api` — Hono + @hono/zod-openapi の API。ベースパスは `/api`
- `apps/web` — React + Vite の SPA。開発時は Vite が `/api` を API に転送する
- `packages/shared` — API と Web で共有する Zod スキーマと型（hono に依存させない）
- `prompts/` — LLM に渡すプロンプト。用途ごとのディレクトリに `v1.md`, `v2.md` … を置く
- `evals/` — 評価データ。`samples/` には架空の求人票だけを置く

## コマンド

```bash
pnpm install
pnpm dev:api        # http://localhost:8787
pnpm dev:web        # http://localhost:5173
pnpm lint && pnpm typecheck && pnpm test && pnpm build   # CI と同じ検査
pnpm format
pnpm extract evals/samples/sample-01.txt   # 求人票を LLM で構造化（要 ANTHROPIC_API_KEY）
```

## API のレイヤールール（ADR-0002）

```
routes/        HTTP の入出力のみ。リクエスト検証とレスポンス整形
services/      ビジネスロジック
repositories/  DB アクセス
lib/           LLM クライアント、キューなど外部サービスのラッパー
app.ts         組み立て（Composition Root）。依存の結線はここだけで行う
```

- 依存は `routes → services → repositories` の一方向のみ。ESLint（`no-restricted-imports`）で検査している
- 外部サービスは services からインターフェース経由で使い、`createApp(deps)` でテスト時に差し替える
- 業務エラーは `lib/app-error.ts` の `AppError` を投げる。HTTP への変換は `app.ts` の `onError` が行う
- エラー応答は必ず共通形式 `{ error: { code, message, details? } }`（`docs/api.md`）

## スキーマ

- リクエスト・レスポンスのスキーマは `packages/shared/src/schemas/` に Zod で定義し、API と Web の両方から使う
- API のルートは `createRoute` で定義し、OpenAPI は `/api/openapi.json` で自動生成される

## LLM

- LLM の呼び出しは `lib/llm/` の `LlmClient` インターフェース経由で行う。services は SDK を直接 import しない
- 出力の形は `packages/shared` の Zod スキーマで定義し、LLM に渡す JSON スキーマの生成と応答の検証の両方に使う。応答は必ず Zod で検証する
- プロンプトはコードに埋め込まず `prompts/` に置き、`loadPrompt(name, version)` で読み込む。評価に使ったバージョンは書き換えず、新しいバージョンのファイルを作る（`prompts/README.md`）
- テストでは実際の API を呼ばない。`LlmClient` や Messages API を偽物に差し替える
- 料金を変更したら `lib/llm/pricing.ts` を更新する

## テスト

- Vitest。API は `app.request()` で HTTP レベルのテストを書く（サーバー起動不要）
- 時刻・乱数・外部 API は依存として注入し、テストでは固定値やモックを使う

## 注意事項

- TypeScript は 6.0 系に固定している（typescript-eslint が 7 系に未対応のため）
- 秘密情報（API キーなど）をコミットしない。環境変数は `apps/api/.env`（`.env.example` を参照）。API キーをログや出力に含めない
- 実在する求人票のテキストをコミットしない（著作物のため）。手元で使う場合は `evals/private/` に置く
- コミットメッセージは Conventional Commits 形式（例: `feat(api): ...`）、本文は日本語
- このリポジトリは学習を兼ねたポートフォリオ。作者が自分で実装する予定の部分は、頼まれない限り代わりに実装しない
