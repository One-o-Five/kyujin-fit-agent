import { z } from 'zod';

/**
 * 求人票から構造化して取り出す情報（docs/data-model.md の job_posts.parsed）。
 * LLM に渡す出力スキーマと、応答の検証の両方に使う。
 *
 * 求人票に記載がない項目は、推測せずに null（配列は空）とする。
 *
 * TODO: 日本の求人票に特化した項目を追加する（docs/requirements.md）
 *   - 固定残業代（有無・時間・金額）
 *   - 試用期間
 *   - 業務・就業場所の変更の範囲
 *   - 日本語・英語の要件、ビザ
 */
export const JobPostParsedSchema = z.object({
  title: z.string().nullable().describe('募集職種の名称。記載がなければ null'),
  requirements: z.object({
    required: z.array(z.string()).describe('必須要件。求人票の表現のまま、1要件を1要素にする'),
    preferred: z.array(z.string()).describe('歓迎要件。求人票の表現のまま、1要件を1要素にする'),
  }),
  compensation: z.object({
    annualMin: z.number().int().nullable().describe('想定年収の下限（円）。記載がなければ null'),
    annualMax: z.number().int().nullable().describe('想定年収の上限（円）。記載がなければ null'),
  }),
});
export type JobPostParsed = z.infer<typeof JobPostParsedSchema>;
