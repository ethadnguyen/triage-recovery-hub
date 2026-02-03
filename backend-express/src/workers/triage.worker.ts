import { Worker, Job } from 'bullmq';
import { TicketStatus, TicketCategory, TicketUrgency } from '../generated/prisma/client.js';
import { config } from '../config/index.js';
import { getRedisConnection } from '../config/redis.js';
import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';
import { AIService } from '../services/ai.service.js';
import { TicketRepository } from '../repositories/ticket.repository.js';
import { TriageJobData } from '../services/queue.service.js';

export function createTriageWorker(): Worker<TriageJobData> {
  const aiService = new AIService();
  const ticketRepository = new TicketRepository(prisma);

  const worker = new Worker<TriageJobData>(
    config.queue.triageQueue,
    async (job: Job<TriageJobData>) => {
      const { ticketId, subject, content } = job.data;
      const attempt = job.attemptsMade + 1;

      logger.info('='.repeat(60));
      logger.info(`[Worker] Processing ticket #${ticketId}, attempt ${attempt}/3`);
      logger.info('='.repeat(60));

      try {
        await ticketRepository.updateStatus(ticketId, TicketStatus.PROCESSING);

        await job.updateProgress({ step: 'calling_ai', ticketId });

        const { result, usage } = await aiService.triageTicket(subject, content);

        logger.info(`[Worker] AI Result: category=${result.category}, urgency=${result.urgency}, sentiment=${result.sentimentScore}`);
        logger.info(`[Worker] Token Usage: prompt=${usage.promptTokens}, completion=${usage.completionTokens}, total=${usage.totalTokens}`);
        logger.info(`[Worker] Estimated Cost: $${usage.estimatedCostUsd?.toFixed(6)} USD`);

        const analysisWithUsage = `${result.analysisSummary}

--- Token Usage ---
Model: ${usage.model}
Prompt: ${usage.promptTokens} | Completion: ${usage.completionTokens} | Total: ${usage.totalTokens}
Estimated Cost: $${usage.estimatedCostUsd?.toFixed(6)} USD`;

        await ticketRepository.updateTriageResult(ticketId, {
          category: result.category as TicketCategory,
          sentimentScore: result.sentimentScore,
          urgency: result.urgency as TicketUrgency,
          aiDraftReply: result.draftReply,
          aiAnalysis: analysisWithUsage,
          status: TicketStatus.TRIAGED,
          triagedAt: new Date(),
        });

        logger.info(`[Worker] Ticket #${ticketId} successfully triaged`);

        return {
          status: 'success',
          ticketId,
          category: result.category,
          urgency: result.urgency,
          sentimentScore: result.sentimentScore,
          tokenUsage: usage,
        };
      } catch (error) {
        logger.error(`[Worker] Error processing ticket #${ticketId}:`, error);

        if (attempt >= 3) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await ticketRepository.markAsFailed(
            ticketId,
            `Triage failed after ${attempt} attempts.\nLast error: ${errorMessage.substring(0, 500)}`
          );
          logger.error(`[Worker] Ticket #${ticketId} marked as FAILED after ${attempt} attempts`);
        }

        throw error;
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 1000,
      },
    }
  );

  worker.on('completed', (job) => {
    logger.info(`[Worker] Job ${job.id} completed for ticket #${job.data.ticketId}`);
  });

  worker.on('failed', (job, error) => {
    if (job) {
      logger.error(`[Worker] Job ${job.id} failed for ticket #${job.data.ticketId}:`, error.message);
    }
  });

  worker.on('error', (error) => {
    logger.error('[Worker] Worker error:', error);
  });

  logger.info(`[Worker] Triage worker started, listening to queue: ${config.queue.triageQueue}`);

  return worker;
}
