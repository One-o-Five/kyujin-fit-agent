import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { toValidationDetails } from './validation';

describe('toValidationDetails', () => {
  it('ネストしたパスをドット区切りの文字列に変換する', () => {
    const schema = z.object({
      items: z.array(z.object({ name: z.string().min(1) })),
    });

    const result = schema.safeParse({ items: [{ name: '' }] });
    if (result.success) throw new Error('検証に失敗するはずです');

    const details = toValidationDetails(result.error.issues);

    expect(details).toHaveLength(1);
    expect(details[0]?.path).toBe('items.0.name'); // 어떤 문자열이 나와야 할까?
  });
});
