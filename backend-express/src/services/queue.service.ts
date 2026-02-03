import { Queue, Job } from 'bullmq';
import { config } from '../config/index.js';
import { getRedisConnection } from '../config/redis.js';
import { logger } from '../config/logger.js';

export interface TriageJobData {
  ticketId: number;
  subject: string;
  content: string;
}

export interface IQueueService {
  addTriageJob(data: TriageJobData): Promise<Job<TriageJobData>>;
  getJob(jobId: string): Promise<Job<TriageJobData> | undefined>;
  close(): Promise<void>;
}

export class QueueService implements IQueueService {
  private triageQueue: Queue<TriageJobData>;

  constructor() {
    this.triageQueue = new Queue<TriageJobData>(config.queue.triageQueue, {
      connection: getRedisConnection(),
      defaultJobOptions: config.queue.defaultJobOptions,
    });

    logger.info(`[QueueService] Queue "${config.queue.triageQueue}" initialized`);
  }

  async addTriageJob(data: TriageJobData): Promise<Job<TriageJobData>> {
    const job = await this.triageQueue.add('triage-ticket', data, {
      jobId: `ticket-${data.ticketId}-${Date.now()}`,
    });

    logger.info(`[QueueService] Job added: ${job.id} for ticket #${data.ticketId}`);

    return job;
  }

  async getJob(jobId: string): Promise<Job<TriageJobData> | undefined> {
    return this.triageQueue.getJob(jobId);
  }

  async getJobState(jobId: string): Promise<string | null> {
    const job = await this.triageQueue.getJob(jobId);
    if (!job) return null;
    return job.getState();
  }

  async close(): Promise<void> {
    await this.triageQueue.close();
    logger.info('[QueueService] Queue closed');
  }
}
