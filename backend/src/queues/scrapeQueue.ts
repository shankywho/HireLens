import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

export interface ScrapeJobData {
  companyId: string;
  companyName: string;
  sourceType: 'greenhouse' | 'lever' | 'linkedin' | 'indeed';
  collectorId: string;
  targetUrl?: string;
}

export const scrapeQueue = new Queue<ScrapeJobData>('scrapeQueue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
  },
});
