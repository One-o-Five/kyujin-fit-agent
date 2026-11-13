import type { z } from 'zod';

export interface StructuredRequest<T> {
  /** モデルID（例: claude-haiku-5-5） */
  model: string;
  /** システムプロンプト */
  system: string;
  /** ユーザーメッセージ */
  user: string;
  /** 出力の形。LLM に渡す JSON スキーマの生成と、応答の検証の両方に使う */
  schema: z.ZodType<T>;
  maxTokens: number;
}

export interface LlmUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface StructuredResult<T> {
  data: T;
  model: string;
  usage: LlmUsage;
  latencyMs: number;
}

/**
 * LLM プロバイダーの差し替え口。services はこのインターフェースだけに依存する。
 */
export interface LlmClient {
  generateStructured<T>(request: StructuredRequest<T>): Promise<StructuredResult<T>>;
}

export type LlmOutputErrorReason =
  | 'refusal' // モデルが応答を拒否した
  | 'max_tokens' // 出力がトークン上限で途切れた
  | 'no_text' // テキストの応答がなかった
  | 'invalid_json' // JSON として読めなかった
  | 'schema_mismatch'; // JSON だがスキーマに合わなかった

/** LLM の応答を構造化データとして受け取れなかったときのエラー */
export class LlmOutputError extends Error {
  constructor(
    readonly reason: LlmOutputErrorReason,
    message: string,
    readonly rawText?: string,
    readonly issues?: z.core.$ZodIssue[],
  ) {
    super(message);
    this.name = 'LlmOutputError';
  }
}
