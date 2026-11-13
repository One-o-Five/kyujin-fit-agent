import { describe, expect, it } from 'vitest';
import { estimateCostUsd } from './pricing';

describe('estimateCostUsd', () => {
  it('入力と出力のトークン数から USD を計算する', () => {
    const cost = estimateCostUsd('claude-haiku-5-5', { inputTokens: 5000, outputTokens: 1000 });

    // 5,000 × $0.10 / 100万 + 1,000 × $0.50 / 100万
    expect(cost).toBeCloseTo(0.001, 10);
  });

  it('料金表にないモデルは null を返す', () => {
    expect(estimateCostUsd('unknown-model', { inputTokens: 1, outputTokens: 1 })).toBeNull();
  });
});
