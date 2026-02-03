import { Ticket, TicketStatus } from '../generated/prisma/client.js';
import { TicketRepository, TicketStats } from '../repositories/ticket.repository.js';
import { QueueService, TriageJobData } from './queue.service.js';
import {
  CreateTicketInput,
  UpdateTicketInput,
  ApproveTicketInput,
  TicketQueryInput,
} from '../models/index.js';
import { logger } from '../config/logger.js';
import { AppError } from '../middleware/errorHandler.js';

export interface ITicketService {
  createTicket(data: CreateTicketInput): Promise<Ticket>;
  getTicket(id: number): Promise<Ticket>;
  listTickets(query: TicketQueryInput): Promise<Ticket[]>;
  updateTicket(id: number, data: UpdateTicketInput): Promise<Ticket>;
  approveTicket(id: number, data: ApproveTicketInput): Promise<Ticket>;
  rejectTicket(id: number): Promise<Ticket>;
  retryTriage(id: number): Promise<Ticket>;
  getStats(): Promise<TicketStats>;
}

export class TicketService implements ITicketService {
  constructor(
    private readonly ticketRepository: TicketRepository,
    private readonly queueService: QueueService
  ) {}

  async createTicket(data: CreateTicketInput): Promise<Ticket> {
    logger.info(`[TicketService] Creating ticket for ${data.customerEmail}`);

    const ticket = await this.ticketRepository.create(data);

    const jobData: TriageJobData = {
      ticketId: ticket.id,
      subject: ticket.subject,
      content: ticket.originalText,
    };
    const job = await this.queueService.addTriageJob(jobData);

    if (job.id) {
      await this.ticketRepository.updateJobId(ticket.id, job.id);
    }

    logger.info(`[TicketService] Ticket #${ticket.id} created, job ${job.id} queued`);

    return this.ticketRepository.getById(ticket.id) as Promise<Ticket>;
  }

  async getTicket(id: number): Promise<Ticket> {
    const ticket = await this.ticketRepository.getById(id);

    if (!ticket) {
      throw new AppError(404, 'Ticket not found');
    }

    return ticket;
  }

  async listTickets(query: TicketQueryInput): Promise<Ticket[]> {
    return this.ticketRepository.list(query);
  }

  async updateTicket(id: number, data: UpdateTicketInput): Promise<Ticket> {
    const ticket = await this.getTicket(id);

    const updateData: Partial<Ticket> = {};
    if (data.finalReply !== undefined) updateData.finalReply = data.finalReply;
    if (data.agentNotes !== undefined) updateData.agentNotes = data.agentNotes;
    if (data.status !== undefined) updateData.status = data.status as TicketStatus;

    return this.ticketRepository.update(id, updateData);
  }

  async approveTicket(id: number, data: ApproveTicketInput): Promise<Ticket> {
    const ticket = await this.getTicket(id);

    if (ticket.status !== TicketStatus.TRIAGED && ticket.status !== TicketStatus.APPROVED) {
      throw new AppError(400, `Cannot approve ticket with status: ${ticket.status}`);
    }

    return this.ticketRepository.approve(id, {
      finalReply: data.finalReply,
      agentNotes: data.agentNotes,
    });
  }

  async rejectTicket(id: number): Promise<Ticket> {
    const ticket = await this.getTicket(id);

    if (ticket.status !== TicketStatus.TRIAGED) {
      throw new AppError(400, `Cannot reject ticket with status: ${ticket.status}`);
    }

    return this.ticketRepository.reject(id);
  }

  async retryTriage(id: number): Promise<Ticket> {
    const ticket = await this.getTicket(id);

    await this.ticketRepository.update(id, {
      status: TicketStatus.PENDING,
      category: null,
      sentimentScore: null,
      urgency: null,
      aiDraftReply: null,
      aiAnalysis: null,
      triagedAt: null,
    });

    const jobData: TriageJobData = {
      ticketId: ticket.id,
      subject: ticket.subject,
      content: ticket.originalText,
    };
    const job = await this.queueService.addTriageJob(jobData);

    if (job.id) {
      await this.ticketRepository.updateJobId(id, job.id);
    }

    logger.info(`[TicketService] Ticket #${id} retry queued, job ${job.id}`);

    return this.ticketRepository.getById(id) as Promise<Ticket>;
  }

  async getStats(): Promise<TicketStats> {
    return this.ticketRepository.getStats();
  }

  async getTicketStatus(id: number): Promise<{
    ticketId: number;
    ticketStatus: string;
    jobId: string | null;
    jobState: string | null;
  }> {
    const ticket = await this.getTicket(id);

    let jobState: string | null = null;
    if (ticket.jobId) {
      jobState = await this.queueService.getJobState(ticket.jobId);
    }

    return {
      ticketId: ticket.id,
      ticketStatus: ticket.status,
      jobId: ticket.jobId,
      jobState,
    };
  }
}
