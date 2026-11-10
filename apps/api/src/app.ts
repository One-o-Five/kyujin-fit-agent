import { OpenAPIHono } from '@hono/zod-openapi';
import type { ErrorResponse } from '@kyujin/shared';
import { AppError } from './lib/app-error';
import { healthRoutes } from './routes/health';
import { createHealthService, type HealthService } from './services/health-service';
import { toValidationDetails } from './lib/validation';
import { createAnalysisService, type AnalysisService } from './services/analysis-service';
import { analysisRoutes } from './routes/analyses';

/** 外部依存の差し替え口。テストではここにモックを渡す。 */
export interface AppDeps {
  healthService: HealthService;
  analysisService: AnalysisService;
}

export function defaultDeps(): AppDeps {
  return { healthService: createHealthService(), analysisService: createAnalysisService() };
}

/**
 * アプリケーションの組み立て（Composition Root）。
 * routes / services / repositories の依存関係はここでのみ結線する。
 */
export function createApp(deps: AppDeps = defaultDeps()) {
  const app = new OpenAPIHono({
    // Zod の検証エラーを共通エラー形式で返す
    defaultHook: (result, c) => {
      if (!result.success) {
        const body: ErrorResponse = {
          error: {
            code: 'VALIDATION_ERROR',
            message: '入力値が正しくありません',
            details: toValidationDetails(result.error.issues),
          },
        };
        return c.json(body, 400);
      }
    },
  }).basePath('/api');

  app.route('/', healthRoutes(deps.healthService));
  app.route('/', analysisRoutes(deps.analysisService));

  app.doc('/openapi.json', {
    openapi: '3.1.0',
    info: { title: 'kyujin-fit-agent API', version: '0.0.0' },
  });

  app.notFound((c) => {
    const body: ErrorResponse = {
      error: { code: 'NOT_FOUND', message: 'リソースが見つかりません' },
    };
    return c.json(body, 404);
  });

  app.onError((err, c) => {
    if (err instanceof AppError) {
      const body: ErrorResponse = {
        error: { code: err.code, message: err.message, details: err.details },
      };
      return c.json(body, err.status);
    }
    console.error(err);
    const body: ErrorResponse = {
      error: { code: 'INTERNAL_ERROR', message: 'サーバー内部でエラーが発生しました' },
    };
    return c.json(body, 500);
  });

  return app;
}

export type App = ReturnType<typeof createApp>;
