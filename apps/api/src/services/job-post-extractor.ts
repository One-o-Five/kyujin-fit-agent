import {
  CreateAnalysisRequestSchema,
  JobPostParsedSchema,
  type JobPostParsed,
} from '@kyujin/shared';
import type { LlmClient, StructuredResult } from '../lib/llm/types';

export const EXTRACT_PROMPT_NAME = 'extract-job-post';

export interface ExtractOptions {
  model: string;
  promptVersion: string;
}

export interface JobPostExtractor {
  extract(rawText: string, options: ExtractOptions): Promise<StructuredResult<JobPostParsed>>;
}

export interface JobPostExtractorDeps {
  llm: LlmClient;
  loadPrompt: (name: string, version: string) => Promise<string>;
}

/** 構造化した結果の出力に使うトークン上限 */
const MAX_OUTPUT_TOKENS = 4096;

/**
 * 求人票のテキストを LLM で構造化する。
 * 入力は API と同じ規則（空白の正規化、文字数の範囲）で検証する。
 */
export function createJobPostExtractor(deps: JobPostExtractorDeps): JobPostExtractor {
  return {
    async extract(rawText, options) {
      const { rawText: jobText } = CreateAnalysisRequestSchema.parse({ rawText });
      const system = await deps.loadPrompt(EXTRACT_PROMPT_NAME, options.promptVersion);

      return deps.llm.generateStructured({
        model: options.model,
        system,
        user: `<job_post>\n${jobText}\n</job_post>`,
        schema: JobPostParsedSchema,
        maxTokens: MAX_OUTPUT_TOKENS,
      });
    },
  };
}
