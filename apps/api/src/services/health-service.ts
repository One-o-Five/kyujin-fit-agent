import type { HealthResponse } from '@kyujin/shared';

export interface HealthService {
  check(): HealthResponse;
}

/** 時刻を外から渡せるようにして、テストで固定できるようにする */
export function createHealthService(now: () => Date = () => new Date()): HealthService {
  return {
    check: () => ({ status: 'ok', time: now().toISOString() }),
  };
}
