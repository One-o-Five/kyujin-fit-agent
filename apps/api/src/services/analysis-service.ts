import type { CreateAnalysisRequest, CreateAnalysisResponse } from '@kyujin/shared';

export interface AnalysisService {
  create(input: CreateAnalysisRequest): CreateAnalysisResponse;
}

/**
 * 仮実装。DB を導入するまでは固定の ID を返す。
 * TODO: 利用上限の確認、求人の保存、キューへの登録（docs/api.md）
 */
export function createAnalysisService(): AnalysisService {
  return {
    create: () => ({ id: 1, status: 'pending' }),
  };
}
