import { Router } from 'express';
import type { CompanyResponse } from '@nevis/shared';
import { company } from '../data/company.js';
import { months } from '../data/months.js';

const ARTIFICIAL_DELAY_MS = 300;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const companyRouter = Router();

/**
 * GET /api/company
 *
 * Serves the full client-book tree plus the month labels it's aligned to.
 * A small artificial delay makes the UI's loading state visible in normal
 * use; `?simulateError=1` lets the error state be exercised on demand
 * without having to stop the server.
 */
companyRouter.get('/company', async (req, res) => {
  await delay(ARTIFICIAL_DELAY_MS);

  if (req.query.simulateError === '1') {
    res.status(500).json({ error: 'Simulated server error' });
    return;
  }

  const payload: CompanyResponse = { months, company };
  res.json(payload);
});
