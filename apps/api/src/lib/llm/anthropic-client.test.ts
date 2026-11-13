import type Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createAnthropicLlmClient, type AnthropicMessagesApi } from './anthropic-client';
import { LlmOutputError } from './types';

const schema = z.object({ title: z.string(), annualMin: z.number().nullable() });

const request = {
  model: 'claude-haiku-5-5',
  system: 'system prompt',
  user: 'user message',
  schema,
  maxTokens: 1024,
};

/** SDK の応答のうち、クライアントが読む部分だけを持つ偽の Messages API */
function fakeMessages(response: { text?: string; stopReason?: Anthropic.StopReason }) {
  const calls: unknown[] = [];
  const api = {
    create: async (params: unknown) => {
      calls.push(params);
      return {
        model: 'claude-haiku-5-5',
        stop_reason: response.stopReason ?? 'end_turn',
        content:
          response.text === undefined
            ? []
            : [{ type: 'text', text: response.text, citations: null }],
        usage: { input_tokens: 120, output_tokens: 30 },
      };
    },
  } as unknown as AnthropicMessagesApi;
  return { api, calls };
}

function fixedClock(...times: number[]) {
  let index = 0;
  return () => times[Math.min(index++, times.length - 1)] ?? 0;
}

async function expectLlmOutputError(promise: Promise<unknown>, reason: string) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(LlmOutputError);
  expect((error as LlmOutputError).reason).toBe(reason);
}

describe('createAnthropicLlmClient', () => {
  it('スキーマに合う応答を、利用量・処理時間とともに返す', async () => {
    const { api, calls } = fakeMessages({ text: '{"title":"エンジニア","annualMin":null}' });
    const client = createAnthropicLlmClient({ messages: api, now: fixedClock(1000, 1850) });

    const result = await client.generateStructured(request);

    expect(result).toEqual({
      data: { title: 'エンジニア', annualMin: null },
      model: 'claude-haiku-5-5',
      usage: { inputTokens: 120, outputTokens: 30 },
      latencyMs: 850,
    });
    expect(calls[0]).toMatchObject({
      model: 'claude-haiku-5-5',
      max_tokens: 1024,
      system: 'system prompt',
      messages: [{ role: 'user', content: 'user message' }],
      output_config: { format: { type: 'json_schema' } },
    });
  });

  it('モデルが拒否した場合は refusal', async () => {
    const { api } = fakeMessages({ stopReason: 'refusal' });
    const client = createAnthropicLlmClient({ messages: api });

    await expectLlmOutputError(client.generateStructured(request), 'refusal');
  });

  it('出力が途切れた場合は max_tokens', async () => {
    const { api } = fakeMessages({ text: '{"title":"エン', stopReason: 'max_tokens' });
    const client = createAnthropicLlmClient({ messages: api });

    await expectLlmOutputError(client.generateStructured(request), 'max_tokens');
  });

  it('テキストの応答がない場合は no_text', async () => {
    const { api } = fakeMessages({});
    const client = createAnthropicLlmClient({ messages: api });

    await expectLlmOutputError(client.generateStructured(request), 'no_text');
  });

  it('JSON として読めない場合は invalid_json', async () => {
    const { api } = fakeMessages({ text: 'これは JSON ではありません' });
    const client = createAnthropicLlmClient({ messages: api });

    await expectLlmOutputError(client.generateStructured(request), 'invalid_json');
  });

  it('スキーマに合わない場合は schema_mismatch', async () => {
    const { api } = fakeMessages({ text: '{"title":123,"annualMin":null}' });
    const client = createAnthropicLlmClient({ messages: api });

    await expectLlmOutputError(client.generateStructured(request), 'schema_mismatch');
  });
});
