import express from 'express';
import cors from 'cors';
import { companyRouter } from './routes/company.js';

export function createApp() {
  const app = express();

  const allowedOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
  app.use(cors({ origin: allowedOrigin }));

  app.get('/', (_req, res) => {
    res.json({ message: 'Nevis Clients API — see GET /api/company' });
  });

  app.use('/api', companyRouter);

  return app;
}
