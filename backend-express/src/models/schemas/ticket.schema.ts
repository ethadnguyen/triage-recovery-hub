import { z } from 'zod';

export const TicketStatusEnum = z.enum([
  'PENDING',
  'PROCESSING',
  'TRIAGED',
  'APPROVED',
  'REJECTED',
  'FAILED',
]);

export const TicketCategoryEnum = z.enum([
  'BILLING',
  'TECHNICAL',
  'FEATURE_REQUEST',
  'GENERAL',
  'UNKNOWN',
]);

export const TicketUrgencyEnum = z.enum(['HIGH', 'MEDIUM', 'LOW']);

export const CreateTicketSchema = z.object({
  customerName: z
    .string()
    .min(1, 'Customer name is required')
    .max(255, 'Customer name too long'),
  customerEmail: z.string().email('Invalid email format'),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(500, 'Subject too long'),
  originalText: z
    .string()
    .min(10, 'Complaint text must be at least 10 characters'),
});

export const UpdateTicketSchema = z.object({
  finalReply: z.string().optional(),
  agentNotes: z.string().optional(),
  status: TicketStatusEnum.optional(),
});

export const ApproveTicketSchema = z.object({
  finalReply: z.string().min(1, 'Final reply is required'),
  agentNotes: z.string().optional(),
});

export const TicketQuerySchema = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: TicketStatusEnum.optional(),
  urgency: TicketUrgencyEnum.optional(),
  category: TicketCategoryEnum.optional(),
});

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>;
export type ApproveTicketInput = z.infer<typeof ApproveTicketSchema>;
export type TicketQueryInput = z.infer<typeof TicketQuerySchema>;
export type TicketStatus = z.infer<typeof TicketStatusEnum>;
export type TicketCategory = z.infer<typeof TicketCategoryEnum>;
export type TicketUrgency = z.infer<typeof TicketUrgencyEnum>;
