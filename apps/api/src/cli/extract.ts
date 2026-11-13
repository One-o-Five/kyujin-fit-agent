/**
 * 求人票のテキストファイルを LLM で構造化し、結果を表示する。
 *
 *   pnpm extract evals/samples/sample-01.txt
 *   pnpm extract evals/samples/sample-01.txt --model claude-sonnet-5-5 --prompt v1
 *
 * 構造化した JSON は標準出力に、モデル・トークン数・推定コスト・処理時間は標準エラー出力に出す。
 */
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createAnthropicLlmClient, createAnthropicMessagesApi } from '../lib/llm/anthropic-client';
import { estimateCostUsd } from '../lib/llm/pricing';
import { LlmOutputError } from '../lib/llm/types';
import { loadPrompt } from '../lib/prompts';
import { createJobPostExtractor } from '../services/job-post-extractor';

const DEFAULT_MODEL = 'claude-haiku-5-5';
const DEFAULT_PROMPT_VERSION = 'v1';

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      model: { type: 'string', default: DEFAULT_MODEL },
      prompt: { type: 'string', default: DEFAULT_PROMPT_VERSION },
    },
  });
  const [file] = positionals;
  if (!file) {
    throw new Error(
      '使い方: pnpm extract <求人票のテキストファイル> [--model <ID>] [--prompt <v1>]',
    );
  }

  // apps/api/.env を読み込む（秘密情報はコミットしない）
  const envFile = fileURLToPath(new URL('../../.env', import.meta.url));
  if (existsSync(envFile)) process.loadEnvFile(envFile);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY が設定されていません。apps/api/.env に設定してください');
  }

  // pnpm --filter 経由では作業ディレクトリが apps/api になるため、実行元を基準にパスを解決する
  const rawText = await readFile(resolve(process.env.INIT_CWD ?? process.cwd(), file), 'utf8');

  const extractor = createJobPostExtractor({
    llm: createAnthropicLlmClient({ messages: createAnthropicMessagesApi(apiKey) }),
    loadPrompt,
  });
  const result = await extractor.extract(rawText, {
    model: values.model,
    promptVersion: values.prompt,
  });

  console.log(JSON.stringify(result.data, null, 2));

  const cost = estimateCostUsd(result.model, result.usage);
  console.error(
    [
      `model:   ${result.model}`,
      `prompt:  ${values.prompt}`,
      `tokens:  input ${result.usage.inputTokens} / output ${result.usage.outputTokens}`,
      `cost:    ${cost === null ? '不明（料金表にないモデル）' : `$${cost.toFixed(6)}`}`,
      `latency: ${result.latencyMs} ms`,
    ].join('\n'),
  );
}

main().catch((error: unknown) => {
  if (error instanceof LlmOutputError) {
    // LLM の応答を構造化データとして受け取れなかった場合は、原因と応答の原文を表示する
    console.error(`LLM の出力エラー（${error.reason}）: ${error.message}`);
    if (error.issues) console.error(JSON.stringify(error.issues, null, 2));
    if (error.rawText) console.error(`--- 応答の原文 ---\n${error.rawText}`);
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exitCode = 1;
});
