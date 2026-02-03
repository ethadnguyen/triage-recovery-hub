import { Router } from 'express';
import { createTicketRoutes } from './ticket.routes.js';
import { TicketController } from '../controllers/ticket.controller.js';
import { HealthController } from '../controllers/health.controller.js';

export function createRoutes(ticketController: TicketController): Router {
  const router = Router();
  const healthController = new HealthController();

  router.get('/', healthController.getRoot);

  router.get('/health', healthController.checkHealth);

  router.use('/tickets', createTicketRoutes(ticketController));

  return router;
}
