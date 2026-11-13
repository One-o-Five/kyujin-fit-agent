import { JOB_TEXT_MIN_LENGTH, type JobPostParsed } from '@kyujin/shared';
import { describe, expect, it } from 'vitest';
import type { LlmClient, StructuredRequest } from '../lib/llm/types';
import { createJobPostExtractor } from './job-post-extractor';

const parsed: JobPostParsed = {
  title: 'バックエンドエンジニア',
  requirements: { required: ['Webアプリケーションの開発経験（3年以上）'], preferred: [] },
  compensation: { annualMin: 5000000, annualMax: 7500000 },
};

function fakeLlm() {
  const requests: StructuredRequest<unknown>[] = [];
  const llm: LlmClient = {
    generateStructured: async <T>(request: StructuredRequest<T>) => {
      requests.push(request);
      return {
        data: request.schema.parse(parsed),
        model: request.model,
        usage: { inputTokens: 100, outputTokens: 50 },
        latencyMs: 10,
      };
    },
  };
  return { llm, requests };
}

const options = { model: 'claude-haiku-5-5', promptVersion: 'v1' };

describe('createJobPostExtractor', () => {
  it('正規化した求人テキストとプロンプトを LLM に渡し、構造化した結果を返す', async () => {
    const { llm, requests } = fakeLlm();
    const loaded: string[] = [];
    const extractor = createJobPostExtractor({
      llm,
      loadPrompt: async (name, version) => {
        loaded.push(`${name}/${version}`);
        return 'system prompt';
      },
    });
    const body = 'あ'.repeat(JOB_TEXT_MIN_LENGTH);

    const result = await extractor.extract(`  ${body}\u3000\u3000`, options);

    expect(result.data).toEqual(parsed);
    expect(loaded).toEqual(['extract-job-post/v1']);
    expect(requests[0]).toMatchObject({
      model: 'claude-haiku-5-5',
      system: 'system prompt',
      user: `<job_post>\n${body}\n</job_post>`,
    });
  });

  it('短すぎる求人テキストは LLM を呼ばずに拒否する', async () => {
    const { llm, requests } = fakeLlm();
    const extractor = createJobPostExtractor({ llm, loadPrompt: async () => 'system prompt' });

    await expect(extractor.extract('短い求人票', options)).rejects.toThrow();
    expect(requests).toHaveLength(0);
  });
});
