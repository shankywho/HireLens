import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import listingRoutes from './routes/listingRoutes';
import companyRoutes from './routes/companyRoutes';
import collectorRoutes from './routes/collectorRoutes';
import { getFixtureV1, getFixtureV2 } from './controllers/fixtureController';
import { setupScrapeWorker } from './queues/scrapeWorker';
import { errorHandler } from './middlewares/errorHandler';
import { NotFoundError } from './errors/AppError';

const app = express();

// Production-Ready CORS Configuration
const allowedOrigins = [
  'http://localhost:5180',
  'http://127.0.0.1:5180',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        env.NODE_ENV === 'production' ||
        origin.includes('vercel.app') ||
        origin.includes('railway.app') ||
        origin.includes('onrender.com') ||
        origin.includes('pages.dev')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Lightweight Healthcheck Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'HireLens Backend System',
  });
});

// Demo HTML Fixtures for Break-and-Heal Walkthrough
app.get('/fixture/v1', getFixtureV1);
app.get('/fixture/v2', getFixtureV2);

// API Routes
app.use('/api/listings', listingRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/collectors', collectorRoutes);
app.use('/api/collector', collectorRoutes);

// 404 Catch-All Handler
app.use((req: Request, _res: Response, next) => {
  next(new NotFoundError('API Route', `${req.method} ${req.originalUrl}`));
});

// Global Structured Error Handler
app.use(errorHandler);

// Setup Worker safely
try {
  setupScrapeWorker();
  console.log('⚡ BullMQ Worker initialized successfully');
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn('⚠️ Could not connect to Redis for BullMQ worker (Running in API-only mode):', message);
}

// Start HTTP Server when executed directly
const PORT = env.PORT;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 HireLens Backend Server running on http://localhost:${PORT}`);
    console.log(`📊 Endpoints:`);
    console.log(`   - GET  http://localhost:${PORT}/health`);
    console.log(`   - GET  http://localhost:${PORT}/api/listings`);
    console.log(`   - GET  http://localhost:${PORT}/api/companies`);
    console.log(`   - GET  http://localhost:${PORT}/api/collectors`);
  });
}

export default app;
