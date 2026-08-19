import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('GET /api/company', () => {
  it('returns the company tree with matching month labels', async () => {
    const res = await request(createApp()).get('/api/company');

    expect(res.status).toBe(200);
    expect(res.body.months).toHaveLength(12);
    expect(res.body.company.name).toBe('Company');
    expect(res.body.company.values).toHaveLength(12);
  });

  it('returns a 500 when ?simulateError=1 is set', async () => {
    const res = await request(createApp()).get('/api/company?simulateError=1');

    expect(res.status).toBe(500);
  });
});
