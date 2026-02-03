import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';

import { config } from './config/index.js';
import { createRoutes } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { container } from './container.js';

export function createApp(): Express {
  const app = express();

  app.use(helmet());

  app.use(
    cors({
      origin: ['http://localhost:3000', 'http://frontend:3000'],
      credentials: true,
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (config.server.isDev) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  const ticketController = container.ticketController;
  app.use('/', createRoutes(ticketController));

  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
}
