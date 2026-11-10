import { z } from 'zod';

/** 求人テキストの文字数（正規化後）。日本語の求人票14件の実測（最長 約5,100字）の約2倍を上限とする */
export const JOB_TEXT_MIN_LENGTH = 150;
export const JOB_TEXT_MAX_LENGTH = 10_000;

/**
 * 求人テキストの空白を正規化する。
 * 改行は求人票の構造（見出し・箇条書き）を表すため残す。
 */
export function normalizeJobText(text: string): string {
  return text
    .replace(/\r\n?/g, '\n') // 改行コードを LF にそろえる
    .replace(/[ \t\u3000]+/g, ' ') // 連続する空白・タブ・全角スペースを1つに
    .replace(/ *\n */g, '\n') // 行頭・行末の空白を削除
    .replace(/\n{3,}/g, '\n\n') // 3行以上の連続した改行を空行1つに
    .trim();
}

export const CreateAnalysisRequestSchema = z.object({
  rawText: z
    .string({ error: '求人テキストは必須です' })
    .transform(normalizeJobText)
    .pipe(
      z
        .string()
        .min(JOB_TEXT_MIN_LENGTH, {
          error: `求人テキストは${JOB_TEXT_MIN_LENGTH}文字以上で入力してください`,
        })
        .max(JOB_TEXT_MAX_LENGTH, {
          error: `求人テキストは${JOB_TEXT_MAX_LENGTH}文字以内で入力してください`,
        }),
    ),
});
export type CreateAnalysisRequest = z.infer<typeof CreateAnalysisRequestSchema>;

export const AnalysisStatusSchema = z.enum(['pending']);

export const CreateAnalysisResponseSchema = z.object({
  id: z.number().int().positive(),
  status: AnalysisStatusSchema,
});
export type CreateAnalysisResponse = z.infer<typeof CreateAnalysisResponseSchema>;
