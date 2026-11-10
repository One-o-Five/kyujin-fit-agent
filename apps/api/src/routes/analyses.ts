import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import {
  CreateAnalysisRequestSchema,
  CreateAnalysisResponseSchema,
  ErrorResponseSchema,
} from '@kyujin/shared';
import type { AnalysisService } from '../services/analysis-service';

const route = createRoute({
  method: 'post',
  path: '/analyses',
  tags: ['analyses'],
  summary: '求人テキストの分析を開始する',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: CreateAnalysisRequestSchema } },
    },
  },
  responses: {
    202: {
      description: '分析を受け付けた',
      content: { 'application/json': { schema: CreateAnalysisResponseSchema } },
    },
    400: {
      description: '入力値の検証エラー',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export function analysisRoutes(analysisService: AnalysisService) {
  return new OpenAPIHono().openapi(route, (c) => {
    const input = c.req.valid('json');
    return c.json(analysisService.create(input), 202);
  });
}
