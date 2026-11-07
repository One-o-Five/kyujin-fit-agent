import { z } from 'zod';

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  time: z.iso.datetime({ offset: true }),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
