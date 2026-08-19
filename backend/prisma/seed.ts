import { PrismaClient } from '@prisma/client';
import { recomputeJobScore } from '../src/queues/scrapeWorker';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding HireLens Database...');

  // Reset existing data
  await prisma.jobScore.deleteMany({});
  await prisma.listingSnapshot.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.collectorHealth.deleteMany({});

  // 1. Create Core Companies (Stripe, Coinbase, DoorDash, Brex)
  const stripe = await prisma.company.create({
    data: {
      name: 'Stripe',
      careerPageUrl: 'https://boards.greenhouse.io/stripe',
      atsPlatform: 'greenhouse',
    },
  });

  const coinbase = await prisma.company.create({
    data: {
      name: 'Coinbase',
      careerPageUrl: 'https://boards.greenhouse.io/coinbase',
      atsPlatform: 'greenhouse',
    },
  });

  const doordash = await prisma.company.create({
    data: {
      name: 'DoorDash',
      careerPageUrl: 'https://boards.greenhouse.io/doordash',
      atsPlatform: 'greenhouse',
    },
  });

  const brex = await prisma.company.create({
    data: {
      name: 'Brex',
      careerPageUrl: 'https://jobs.lever.co/brex',
      atsPlatform: 'lever',
    },
  });

  // Seed Collector Health statuses
  await prisma.collectorHealth.createMany({
    data: [
      {
        collectorId: 'c_greenhouse',
        sourceType: 'greenhouse',
        status: 'HEALTHY',
        lastRunAt: new Date(),
        failureCount: 0,
      },
      {
        collectorId: 'c_lever',
        sourceType: 'lever',
        status: 'HEALTHY',
        lastRunAt: new Date(),
        failureCount: 0,
      },
      {
        collectorId: 'c_linkedin',
        sourceType: 'linkedin',
        status: 'HEALTHY',
        lastRunAt: new Date(),
        failureCount: 0,
      },
      {
        collectorId: 'c_indeed',
        sourceType: 'indeed',
        status: 'DEGRADED',
        lastRunAt: new Date(Date.now() - 3600000),
        failureCount: 1,
      },
    ],
  });

  console.log('🏢 Companies & Collector Health seeded.');

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  // Canonical normalized job IDs for seed listings
  const STRIPE_INFRA_ID = 'stripe-l2-infrastructure';
  const COINBASE_INTERN_ID = 'coinbase-intern-backend';
  const DOORDASH_LOGISTICS_ID = 'doordash-senior-logistics';
  const BREX_PAYMENTS_ID = 'brex-staff-payments';

  // 2. Seed Snapshots with canonical matching IDs
  const rawSnapshots = [
    // Stripe Infrastructure Role (seen on Greenhouse, LinkedIn, Indeed - all mapped to stripe-l2-infrastructure)
    {
      normalizedJobId: STRIPE_INFRA_ID,
      company: stripe,
      source: 'greenhouse',
      rawTitle: 'Software Engineer II, Infrastructure',
      location: 'San Francisco, CA',
      salaryMin: 160000,
      salaryMax: 210000,
      status: 'open',
      postedDate: daysAgo(12),
      capturedAt: daysAgo(10),
      url: 'https://boards.greenhouse.io/stripe/jobs/4019283',
    },
    {
      normalizedJobId: STRIPE_INFRA_ID,
      company: stripe,
      source: 'linkedin',
      rawTitle: 'Backend SWE - Infrastructure Team',
      location: 'San Francisco, CA',
      salaryMin: 165000,
      salaryMax: 215000,
      status: 'open',
      postedDate: daysAgo(12),
      capturedAt: daysAgo(5),
      url: 'https://www.linkedin.com/jobs/view/3910293',
    },
    {
      normalizedJobId: STRIPE_INFRA_ID,
      company: stripe,
      source: 'indeed',
      rawTitle: 'Software Developer - Infrastructure',
      location: 'San Francisco, CA',
      salaryMin: 130000, // Salary spread > 20%!
      salaryMax: 220000,
      status: 'open',
      postedDate: daysAgo(35), // Reposted > 30 days
      capturedAt: daysAgo(1),
      url: 'https://www.indeed.com/viewjob?jk=8392019',
    },

    // Coinbase Intern Role (seen on Greenhouse and LinkedIn - has status mismatch!)
    {
      normalizedJobId: COINBASE_INTERN_ID,
      company: coinbase,
      source: 'greenhouse',
      rawTitle: 'Backend Engineer Intern',
      location: 'Remote',
      salaryMin: 55,
      salaryMax: 70,
      status: 'open',
      postedDate: daysAgo(8),
      capturedAt: daysAgo(4),
      url: 'https://boards.greenhouse.io/coinbase/jobs/559102',
    },
    {
      normalizedJobId: COINBASE_INTERN_ID,
      company: coinbase,
      source: 'linkedin',
      rawTitle: 'Software Engineer Intern - Backend',
      location: 'Remote',
      salaryMin: 55,
      salaryMax: 70,
      status: 'closed', // Status mismatch flag!
      postedDate: daysAgo(8),
      capturedAt: daysAgo(1),
      url: 'https://www.linkedin.com/jobs/view/1029384',
    },

    // DoorDash Logistics (Stale role > 45 days)
    {
      normalizedJobId: DOORDASH_LOGISTICS_ID,
      company: doordash,
      source: 'greenhouse',
      rawTitle: 'Senior Software Engineer, Logistics',
      location: 'Seattle, WA',
      salaryMin: 190000,
      salaryMax: 250000,
      status: 'open',
      postedDate: daysAgo(60), // Stale 60 days!
      capturedAt: daysAgo(1),
      url: 'https://boards.greenhouse.io/doordash/jobs/102938',
    },

    // Brex Staff Engineer (Single-source - Guardrail B cap 85)
    {
      normalizedJobId: BREX_PAYMENTS_ID,
      company: brex,
      source: 'lever',
      rawTitle: 'Staff Software Engineer, Payments',
      location: 'New York, NY',
      salaryMin: 220000,
      salaryMax: 280000,
      status: 'open',
      postedDate: daysAgo(5),
      capturedAt: daysAgo(2),
      url: 'https://jobs.lever.co/brex/891029',
    },
  ];

  console.log('📸 Seeding Canonical Snapshots...');

  const normalizedIds = new Set<string>();

  for (const item of rawSnapshots) {
    normalizedIds.add(item.normalizedJobId);

    await prisma.listingSnapshot.create({
      data: {
        normalizedJobId: item.normalizedJobId,
        companyId: item.company.id,
        source: item.source,
        rawTitle: item.rawTitle,
        salaryMin: item.salaryMin,
        salaryMax: item.salaryMax,
        status: item.status,
        postedDate: item.postedDate,
        capturedAt: item.capturedAt,
        url: item.url,
      },
    });
  }

  console.log('⚖️ Computing Hiring Confidence Scores...');

  for (const normId of normalizedIds) {
    await recomputeJobScore(normId);
  }

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
