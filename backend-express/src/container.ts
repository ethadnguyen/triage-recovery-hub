import { prisma } from './config/database.js';
import { TicketRepository } from './repositories/ticket.repository.js';
import { AIService } from './services/ai.service.js';
import { QueueService } from './services/queue.service.js';
import { TicketService } from './services/ticket.service.js';
import { TicketController } from './controllers/ticket.controller.js';

class Container {
  private static instance: Container;
  
  private _ticketRepository?: TicketRepository;
  private _aiService?: AIService;
  private _queueService?: QueueService;
  private _ticketService?: TicketService;
  private _ticketController?: TicketController;

  private constructor() {}

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  get ticketRepository(): TicketRepository {
    if (!this._ticketRepository) {
      this._ticketRepository = new TicketRepository(prisma);
    }
    return this._ticketRepository;
  }

  get aiService(): AIService {
    if (!this._aiService) {
      this._aiService = new AIService();
    }
    return this._aiService;
  }

  get queueService(): QueueService {
    if (!this._queueService) {
      this._queueService = new QueueService();
    }
    return this._queueService;
  }

  get ticketService(): TicketService {
    if (!this._ticketService) {
      this._ticketService = new TicketService(
        this.ticketRepository,
        this.queueService
      );
    }
    return this._ticketService;
  }

  get ticketController(): TicketController {
    if (!this._ticketController) {
      this._ticketController = new TicketController(this.ticketService);
    }
    return this._ticketController;
  }

  async cleanup(): Promise<void> {
    if (this._queueService) {
      await this._queueService.close();
    }
  }
}

export const container = Container.getInstance();
