import { ErrorResponseSchema, HealthResponseSchema } from '@kyujin/shared';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';
import { createHealthService } from './services/health-service';

const fixedNow = () => new Date('2026-11-09T00:00:00.000Z');
const app = createApp({ healthService: createHealthService(fixedNow) });

describe('GET /api/health', () => {
  it('200 と共有スキーマに沿った本文を返す', async () => {
    const res = await app.request('/api/health');

    expect(res.status).toBe(200);
    const body = HealthResponseSchema.parse(await res.json());
    expect(body).toEqual({ status: 'ok', time: '2026-11-09T00:00:00.000Z' });
  });
});

describe('共通エラー形式', () => {
  it('存在しないパスは 404 と NOT_FOUND を返す', async () => {
    const res = await app.request('/api/does-not-exist');

    expect(res.status).toBe(404);
    const body = ErrorResponseSchema.parse(await res.json());
    expect(body.error.code).toBe('NOT_FOUND');
  });
});

describe('GET /api/openapi.json', () => {
  it('ヘルスチェックを含む OpenAPI ドキュメントを返す', async () => {
    const res = await app.request('/api/openapi.json');

    expect(res.status).toBe(200);
    const doc = (await res.json()) as { paths: Record<string, unknown> };
    expect(Object.keys(doc.paths)).toContain('/api/health');
  });
});
