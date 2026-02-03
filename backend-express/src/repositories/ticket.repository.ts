import { PrismaClient, Ticket, TicketStatus, TicketCategory, TicketUrgency, Prisma } from '../generated/prisma/client.js';
import { CreateTicketInput, TicketQueryInput } from '../models/index.js';

export interface ITicketRepository {
  create(data: CreateTicketInput): Promise<Ticket>;
  getById(id: number): Promise<Ticket | null>;
  list(query: TicketQueryInput): Promise<Ticket[]>;
  update(id: number, data: Partial<Ticket>): Promise<Ticket>;
  updateStatus(id: number, status: TicketStatus): Promise<Ticket>;
  updateTriageResult(
    id: number,
    data: {
      category: TicketCategory;
      sentimentScore: number;
      urgency: TicketUrgency;
      aiDraftReply: string;
      aiAnalysis: string;
      status: TicketStatus;
      triagedAt: Date;
    }
  ): Promise<Ticket>;
  count(filters?: { status?: TicketStatus; urgency?: TicketUrgency; category?: TicketCategory }): Promise<number>;
  getStats(): Promise<TicketStats>;
}

export interface TicketStats {
  total: number;
  pending: number;
  processing: number;
  triaged: number;
  approved: number;
  rejected: number;
  failed: number;
  byUrgency: Record<string, number>;
  byCategory: Record<string, number>;
}

export class TicketRepository implements ITicketRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateTicketInput): Promise<Ticket> {
    return this.prisma.ticket.create({
      data: {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        subject: data.subject,
        originalText: data.originalText,
        status: TicketStatus.PENDING,
      },
    });
  }

  async getById(id: number): Promise<Ticket | null> {
    return this.prisma.ticket.findUnique({
      where: { id },
    });
  }

  async list(query: TicketQueryInput): Promise<Ticket[]> {
    const where: Prisma.TicketWhereInput = {};

    if (query.status) {
      where.status = query.status as TicketStatus;
    }
    if (query.urgency) {
      where.urgency = query.urgency as TicketUrgency;
    }
    if (query.category) {
      where.category = query.category as TicketCategory;
    }

    return this.prisma.ticket.findMany({
      where,
      skip: query.skip,
      take: query.limit,
      orderBy: [
        { urgency: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async update(id: number, data: Partial<Ticket>): Promise<Ticket> {
    return this.prisma.ticket.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: number, status: TicketStatus): Promise<Ticket> {
    return this.prisma.ticket.update({
      where: { id },
      data: { status },
    });
  }

  async updateJobId(id: number, jobId: string): Promise<Ticket> {
    return this.prisma.ticket.update({
      where: { id },
      data: { jobId },
    });
  }

  async updateTriageResult(
    id: number,
    data: {
      category: TicketCategory;
      sentimentScore: number;
      urgency: TicketUrgency;
      aiDraftReply: string;
      aiAnalysis: string;
      status: TicketStatus;
      triagedAt: Date;
    }
  ): Promise<Ticket> {
    return this.prisma.ticket.update({
      where: { id },
      data,
    });
  }

  async markAsFailed(id: number, errorMessage: string): Promise<Ticket> {
    return this.prisma.ticket.update({
      where: { id },
      data: {
        status: TicketStatus.FAILED,
        aiAnalysis: errorMessage,
      },
    });
  }

  async approve(
    id: number,
    data: { finalReply: string; agentNotes?: string }
  ): Promise<Ticket> {
    return this.prisma.ticket.update({
      where: { id },
      data: {
        ...data,
        status: TicketStatus.APPROVED,
        resolvedAt: new Date(),
      },
    });
  }

  async reject(id: number): Promise<Ticket> {
    return this.prisma.ticket.update({
      where: { id },
      data: {
        status: TicketStatus.REJECTED,
        resolvedAt: new Date(),
      },
    });
  }

  async count(filters?: {
    status?: TicketStatus;
    urgency?: TicketUrgency;
    category?: TicketCategory;
  }): Promise<number> {
    return this.prisma.ticket.count({
      where: filters,
    });
  }

  async getStats(): Promise<TicketStats> {
    const [
      total,
      pending,
      processing,
      triaged,
      approved,
      rejected,
      failed,
      urgencyStats,
      categoryStats,
    ] = await Promise.all([
      this.prisma.ticket.count(),
      this.prisma.ticket.count({ where: { status: TicketStatus.PENDING } }),
      this.prisma.ticket.count({ where: { status: TicketStatus.PROCESSING } }),
      this.prisma.ticket.count({ where: { status: TicketStatus.TRIAGED } }),
      this.prisma.ticket.count({ where: { status: TicketStatus.APPROVED } }),
      this.prisma.ticket.count({ where: { status: TicketStatus.REJECTED } }),
      this.prisma.ticket.count({ where: { status: TicketStatus.FAILED } }),
      this.prisma.ticket.groupBy({
        by: ['urgency'],
        _count: { id: true },
        where: { urgency: { not: null } },
      }),
      this.prisma.ticket.groupBy({
        by: ['category'],
        _count: { id: true },
        where: { category: { not: null } },
      }),
    ]);

    const byUrgency: Record<string, number> = {};
    urgencyStats.forEach((stat) => {
      if (stat.urgency) {
        byUrgency[stat.urgency] = stat._count.id;
      }
    });

    const byCategory: Record<string, number> = {};
    categoryStats.forEach((stat) => {
      if (stat.category) {
        byCategory[stat.category] = stat._count.id;
      }
    });

    return {
      total,
      pending,
      processing,
      triaged,
      approved,
      rejected,
      failed,
      byUrgency,
      byCategory,
    };
  }
}
