import { describe, expect, it } from 'vitest';
import {
  CreateAnalysisRequestSchema,
  JOB_TEXT_MAX_LENGTH,
  JOB_TEXT_MIN_LENGTH,
  normalizeJobText,
} from './analysis';

describe('normalizeJobText', () => {
  it('連続する空白と全角スペースを1つにまとめる', () => {
    // 半角スペース2つ + 全角スペース + タブ が並んでいる
    const input = '必須  　\tJava';

    expect(normalizeJobText(input)).toBe('必須 Java');
  });

  it('3行以上の連続した改行は空行1つにし、改行自体は残す', () => {
    const input = '仕事内容\n\n\n\n\n応募資格\n必須スキル';

    expect(normalizeJobText(input)).toBe('仕事内容\n\n応募資格\n必須スキル');
  });
});

describe('CreateAnalysisRequestSchema', () => {
  it('正常なテキストは通り、正規化された rawText を返す', () => {
    const body = 'あ'.repeat(JOB_TEXT_MIN_LENGTH);

    const result = CreateAnalysisRequestSchema.safeParse({ rawText: `  ${body}  ` });

    expect(result.success).toBe(true);
    if (!result.success) throw new Error('検証に成功するはずです');
    expect(result.data.rawText).toBe(`${body}`);
  });

  it('空白だけの入力は正規化後に0文字になるため失敗する', () => {
    const result = CreateAnalysisRequestSchema.safeParse({ rawText: ' '.repeat(500) });

    expect(result.success).toBe(false);
  });

  it('上限を1文字超えると失敗する', () => {
    const result = CreateAnalysisRequestSchema.safeParse({
      rawText: 'あ'.repeat(JOB_TEXT_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });
});
