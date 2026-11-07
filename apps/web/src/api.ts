import { HealthResponseSchema, type HealthResponse } from '@kyujin/shared';

/** APIの応答を共有スキーマで検証してから返す */
export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return HealthResponseSchema.parse(await res.json());
}
