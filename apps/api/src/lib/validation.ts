import type { z } from 'zod';

export interface ValidationDetail {
  path: string;
  message: string;
}

export function toValidationDetails(issues: z.core.$ZodIssue[]): ValidationDetail[] {
  return issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));
}
