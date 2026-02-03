import { Router } from 'express';
import { TicketController } from '../controllers/ticket.controller.js';

export function createTicketRoutes(ticketController: TicketController): Router {
  const router = Router();

  router.get('/stats', ticketController.getStats);

  router.post('/', ticketController.createTicket);

  router.get('/', ticketController.listTickets);

  router.get('/:id', ticketController.getTicket);

  router.get('/:id/status', ticketController.getTicketStatus);

  router.patch('/:id', ticketController.updateTicket);

  router.post('/:id/approve', ticketController.approveTicket);

  router.post('/:id/reject', ticketController.rejectTicket);

  router.post('/:id/retry', ticketController.retryTriage);

  return router;
}
