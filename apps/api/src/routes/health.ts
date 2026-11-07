import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { HealthResponseSchema } from '@kyujin/shared';
import type { HealthService } from '../services/health-service';

const route = createRoute({
  method: 'get',
  path: '/health',
  tags: ['system'],
  summary: 'ヘルスチェック',
  responses: {
    200: {
      description: 'APIが稼働している',
      content: { 'application/json': { schema: HealthResponseSchema } },
    },
  },
});

export function healthRoutes(healthService: HealthService) {
  return new OpenAPIHono().openapi(route, (c) => c.json(healthService.check(), 200));
}
