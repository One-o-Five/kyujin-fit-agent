import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import {
  LlmOutputError,
  type LlmClient,
  type StructuredRequest,
  type StructuredResult,
} from './types';

/** テストで差し替えられるよう、SDK のうち使う部分だけを型として切り出す */
export type AnthropicMessagesApi = Pick<Anthropic['messages'], 'create'>;

export interface AnthropicLlmClientOptions {
  messages: AnthropicMessagesApi;
  /** 経過時間の計測に使う時計（ミリ秒）。テストで固定できるよう注入する */
  now?: () => number;
}

export function createAnthropicMessagesApi(apiKey: string): AnthropicMessagesApi {
  return new Anthropic({ apiKey }).messages;
}

/**
 * Claude の構造化出力（output_config.format）で JSON を受け取り、Zod で検証して返す。
 * 構造化出力でも、拒否・トークン上限・スキーマの制約の非強制により形が崩れることがあるため、
 * 応答は必ず Zod で検証する（ADR-0002）。
 */
export function createAnthropicLlmClient(options: AnthropicLlmClientOptions): LlmClient {
  const { messages, now = () => performance.now() } = options;

  return {
    async generateStructured<T>(request: StructuredRequest<T>): Promise<StructuredResult<T>> {
      const startedAt = now();
      const message = await messages.create({
        model: request.model,
        max_tokens: request.maxTokens,
        system: request.system,
        messages: [{ role: 'user', content: request.user }],
        output_config: { format: zodOutputFormat(request.schema) },
      });
      const latencyMs = Math.round(now() - startedAt);

      if (message.stop_reason === 'refusal') {
        throw new LlmOutputError('refusal', 'モデルが応答を拒否しました');
      }

      const text = message.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');

      if (message.stop_reason === 'max_tokens') {
        throw new LlmOutputError(
          'max_tokens',
          `出力がトークン上限（${request.maxTokens}）で途切れました`,
          text,
        );
      }
      if (text === '') {
        throw new LlmOutputError('no_text', 'テキストの応答がありませんでした');
      }

      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        throw new LlmOutputError('invalid_json', '応答を JSON として読めませんでした', text);
      }

      const parsed = request.schema.safeParse(json);
      if (!parsed.success) {
        throw new LlmOutputError(
          'schema_mismatch',
          '応答がスキーマに合いませんでした',
          text,
          parsed.error.issues,
        );
      }

      return {
        data: parsed.data,
        model: message.model,
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
        },
        latencyMs,
      };
    },
  };
}
