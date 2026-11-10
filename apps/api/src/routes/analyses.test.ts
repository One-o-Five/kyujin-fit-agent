import {
  CreateAnalysisResponseSchema,
  ErrorResponseSchema,
  JOB_TEXT_MAX_LENGTH,
  JOB_TEXT_MIN_LENGTH,
} from '@kyujin/shared';
import { describe, expect, it } from 'vitest';
import { createApp, defaultDeps } from '../app';

const app = createApp(defaultDeps());

const post = (body: unknown) =>
  app.request('/api/analyses', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/analyses', () => {
  it('正常なテキストは 202 と pending を返す', async () => {
    const res = await post({ rawText: 'あ'.repeat(JOB_TEXT_MIN_LENGTH) });

    expect(res.status).toBe(202);
    const body = CreateAnalysisResponseSchema.parse(await res.json());
    expect(body.status).toBe('pending');
  });

  it('空白だけのテキストは 400 と VALIDATION_ERROR を返す', async () => {
    const res = await post({ rawText: ' '.repeat(JOB_TEXT_MIN_LENGTH) });

    expect(res.status).toBe(400);
    const body = ErrorResponseSchema.parse(await res.json());
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toEqual([
      expect.objectContaining({
        path: 'rawText',
        message: `求人テキストは${JOB_TEXT_MIN_LENGTH}文字以上で入力してください`,
      }),
    ]);
  });

  it('上限を超えるテキストは 400 を返す', async () => {
    const res = await post({ rawText: 'あ'.repeat(JOB_TEXT_MAX_LENGTH + 1) });

    expect(res.status).toBe(400);
    const body = ErrorResponseSchema.parse(await res.json());
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toEqual([
      expect.objectContaining({
        path: 'rawText',
        message: `求人テキストは${JOB_TEXT_MAX_LENGTH}文字以内で入力してください`,
      }),
    ]);
  });

  it('rawText がないと 400 を返す', async () => {
    const res = await post({});

    expect(res.status).toBe(400);
    const body = ErrorResponseSchema.parse(await res.json());
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toEqual([
      expect.objectContaining({
        path: 'rawText',
        message: `求人テキストは必須です`,
      }),
    ]);
  });
});
