import express from 'express';
import cors from 'cors';
import { companyRouter } from './routes/company.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use('/api', companyRouter);

  return app;
}
