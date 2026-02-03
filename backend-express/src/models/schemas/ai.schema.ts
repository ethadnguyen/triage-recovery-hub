import { z } from 'zod';

export const AICategoryEnum = z.enum([
  'BILLING',
  'TECHNICAL',
  'FEATURE_REQUEST',
  'GENERAL',
]);

export const AIUrgencyEnum = z.enum(['HIGH', 'MEDIUM', 'LOW']);

export const AITriageResponseSchema = z.object({
  category: AICategoryEnum.describe(
    'Category of the complaint: BILLING (payment/refund), TECHNICAL (bugs/errors), FEATURE_REQUEST (new features), GENERAL (other)'
  ),
  sentimentScore: z
    .number()
    .int()
    .min(1)
    .max(10)
    .describe('Sentiment score 1-10. 1-3: angry, 4-6: neutral, 7-10: positive'),
  urgency: AIUrgencyEnum.describe(
    'Urgency level: HIGH (service down/billing error), MEDIUM (feature issues), LOW (questions/suggestions)'
  ),
  draftReply: z
    .string()
    .describe('Professional, empathetic draft reply to the customer'),
  analysisSummary: z
    .string()
    .describe('Brief internal summary for the support agent'),
});

export const TokenUsageSchema = z.object({
  promptTokens: z.number().int().default(0),
  completionTokens: z.number().int().default(0),
  totalTokens: z.number().int().default(0),
  model: z.string(),
  estimatedCostUsd: z.number().optional(),
});

export type AITriageResponse = z.infer<typeof AITriageResponseSchema>;
export type AICategory = z.infer<typeof AICategoryEnum>;
export type AIUrgency = z.infer<typeof AIUrgencyEnum>;
export type TokenUsage = z.infer<typeof TokenUsageSchema>;
