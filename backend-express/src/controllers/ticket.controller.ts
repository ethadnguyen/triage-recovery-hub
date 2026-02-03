import { Request, Response } from 'express';
import { TicketService } from '../services/ticket.service.js';
import {
  CreateTicketSchema,
  UpdateTicketSchema,
  ApproveTicketSchema,
  TicketQuerySchema,
} from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';

export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  createTicket = async (req: Request, res: Response): Promise<void> => {
    const validatedData = CreateTicketSchema.parse(req.body);
    const ticket = await this.ticketService.createTicket(validatedData);
    
    res.status(201).json(ticket);
  };

  getTicket = async (req: Request, res: Response): Promise<void> => {
    const id = this.parseId(req.params.id);
    const ticket = await this.ticketService.getTicket(id);
    
    res.json(ticket);
  };

  listTickets = async (req: Request, res: Response): Promise<void> => {
    const query = TicketQuerySchema.parse(req.query);
    const tickets = await this.ticketService.listTickets(query);
    
    res.json(tickets);
  };

  updateTicket = async (req: Request, res: Response): Promise<void> => {
    const id = this.parseId(req.params.id);
    const validatedData = UpdateTicketSchema.parse(req.body);
    const ticket = await this.ticketService.updateTicket(id, validatedData);
    
    res.json(ticket);
  };

  approveTicket = async (req: Request, res: Response): Promise<void> => {
    const id = this.parseId(req.params.id);
    const validatedData = ApproveTicketSchema.parse(req.body);
    const ticket = await this.ticketService.approveTicket(id, validatedData);
    
    res.json(ticket);
  };

  rejectTicket = async (req: Request, res: Response): Promise<void> => {
    const id = this.parseId(req.params.id);
    const ticket = await this.ticketService.rejectTicket(id);
    
    res.json(ticket);
  };

  retryTriage = async (req: Request, res: Response): Promise<void> => {
    const id = this.parseId(req.params.id);
    const ticket = await this.ticketService.retryTriage(id);
    
    res.json(ticket);
  };

  getStats = async (_req: Request, res: Response): Promise<void> => {
    const stats = await this.ticketService.getStats();
    
    res.json(stats);
  };

  getTicketStatus = async (req: Request, res: Response): Promise<void> => {
    const id = this.parseId(req.params.id);
    const status = await this.ticketService.getTicketStatus(id);
    
    res.json(status);
  };

  private parseId(idParam: string): number {
    const id = parseInt(idParam, 10);
    if (isNaN(id) || id <= 0) {
      throw new AppError(400, 'Invalid ticket ID');
    }
    return id;
  }
}
