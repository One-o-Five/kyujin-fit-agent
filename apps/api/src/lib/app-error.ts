import type { ErrorCode } from '@kyujin/shared';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * services 層が投げる業務エラー。HTTP への変換は app.ts の onError で一括して行う。
 */
export class AppError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown[],
  ) {
    super(message);
    this.name = 'AppError';
  }
}
