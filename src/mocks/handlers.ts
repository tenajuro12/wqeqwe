// src/mocks/handlers.ts
import { rest } from 'msw';

const API_BASE = 'https://api.coingecko.com/api/v3';

export const mockAssets = [
  {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    current_price: 45000,
    price_change_percentage_24h: 2.5,
    total_volume: 25000000000,
    market_cap: 880000000000,
    image: 'btc-logo.png'
  },
  {
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    current_price: 3200,
    price_change_percentage_24h: -1.2,
    total_volume: 15000000000,
    market_cap: 380000000000,
    image: 'eth-logo.png'
  },
  {
    id: 'cardano',
    symbol: 'ada',
    name: 'Cardano',
    current_price: 1.2,
    price_change_percentage_24h: 0.8,
    total_volume: 5000000000,
    market_cap: 40000000000,
    image: 'ada-logo.png'
  }
];

export const mockChartData = {
  prices: [
    [Date.now() - 6 * 24 * 60 * 60 * 1000, 44000],
    [Date.now() - 5 * 24 * 60 * 60 * 1000, 44500],
    [Date.now() - 4 * 24 * 60 * 60 * 1000, 44600],
    [Date.now() - 3 * 24 * 60 * 60 * 1000, 44750],
    [Date.now() - 2 * 24 * 60 * 60 * 1000, 44800],
    [Date.now() - 1 * 24 * 60 * 60 * 1000, 44900],
    [Date.now(), 45000]
  ]
};

// Default handlers - successful responses (MSW v1.x syntax)
export const handlers = [
  rest.get(`${API_BASE}/coins/markets`, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockAssets));
  }),

  rest.get(`${API_BASE}/coins/:id/market_chart`, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockChartData));
  }),

  rest.get(`${API_BASE}/search`, (req, res, ctx) => {
    const query = req.url.searchParams.get('query')?.toLowerCase() || '';
    const filtered = mockAssets.filter(asset =>
      asset.id.includes(query) ||
      asset.symbol.includes(query) ||
      asset.name.toLowerCase().includes(query)
    );
    return res(ctx.status(200), ctx.json({ coins: filtered }));
  })
];

// Error handlers for testing edge cases (MSW v1.x syntax)
export const errorHandlers = {
  serverError: rest.get(`${API_BASE}/coins/markets`, (_req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }));
  }),

  notFound: rest.get(`${API_BASE}/coins/markets`, (_req, res, ctx) => {
    return res(ctx.status(404), ctx.json({ error: 'Not Found' }));
  }),

  networkError: rest.get(`${API_BASE}/coins/markets`, (_req, res) => {
    return res.networkError('Failed to connect');
  }),

  emptyData: rest.get(`${API_BASE}/coins/markets`, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json([]));
  }),

  rateLimit: rest.get(`${API_BASE}/coins/markets`, (_req, res, ctx) => {
    return res(ctx.status(429), ctx.json({ error: 'Too Many Requests' }));
  }),

  malformedData: rest.get(`${API_BASE}/coins/markets`, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json([
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        current_price: 45000,
        price_change_percentage_24h: 2.5,
        image: 'btc-logo.png'
        // Missing: total_volume, market_cap
      }
    ]));
  }),

  unauthorized: rest.get(`${API_BASE}/coins/markets`, (_req, res, ctx) => {
    return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
  }),

  serviceUnavailable: rest.get(`${API_BASE}/coins/markets`, (_req, res, ctx) => {
    return res(ctx.status(503), ctx.json({ error: 'Service Unavailable' }));
  })
};
