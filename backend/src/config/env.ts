import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z
    .string()
    .default('postgresql://postgres:postgres@localhost:5432/hirelens?schema=public'),
  USE_SYNTHETIC_SCRAPER: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  BRIGHTDATA_API_KEY: z.string().default(''),
  GREENHOUSE_COLLECTOR_ID: z.string().default('c_msx28aib1bi38vk8vw'),
  LEVER_COLLECTOR_ID: z.string().default('c_msoqfr4nik4o54w99'),
  LINKEDIN_COLLECTOR_ID: z.string().default('gd_l4dx9j9sscpvs7no2'),
  INDEED_COLLECTOR_ID: z.string().default('gd_l1viktl72bvl7bjuj0'),
  GEMINI_API_KEY: z.string().default(''),
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.string().transform((val) => parseInt(val, 10)).default('6379'),
  BRIGHTDATA_BROWSER_WS: z.string().optional(),
  BRIGHTDATA_ZONE: z.string().optional(),
  BRIGHTDATA_ZONE_PASSWORD: z.string().optional(),
});

export const env = envSchema.parse(process.env);
