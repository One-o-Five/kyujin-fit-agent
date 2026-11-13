import type { LlmUsage } from './types';

interface ModelPrice {
  /** 入力 100万トークンあたりの USD */
  inputPerMTok: number;
  /** 出力 100万トークンあたりの USD */
  outputPerMTok: number;
}

/**
 * 2026-11-13 時点の標準料金（https://platform.claude.com/docs/en/about-claude/pricing）。
 * Haiku 5.5 はプロンプトが 10万トークンを超えると料金が上がるが、
 * 求人テキストは最大 10,000 文字のため、ここでは考慮しない。
 */
const MODEL_PRICES: Record<string, ModelPrice> = {
  'claude-haiku-5-5': { inputPerMTok: 0.1, outputPerMTok: 0.5 },
  'claude-sonnet-5-5': { inputPerMTok: 2, outputPerMTok: 10 },
};

/** 料金表にないモデルは null を返す（推定できないことを呼び出し側に伝える） */
export function estimateCostUsd(model: string, usage: LlmUsage): number | null {
  const price = MODEL_PRICES[model];
  if (!price) return null;
  return (
    (usage.inputTokens * price.inputPerMTok + usage.outputTokens * price.outputPerMTok) / 1_000_000
  );
}
