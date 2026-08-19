import { PrismaClient } from '@prisma/client';
import { recomputeJobScore } from '../src/queues/scrapeWorker';

const prisma = new PrismaClient();

async function injectLinear() {
  console.log('🚀 Injecting dynamic live scraper payload for Linear...');

  // 1. Ensure Linear company exists
  let linear = await prisma.company.findFirst({
    where: { name: { equals: 'Linear', mode: 'insensitive' } },
  });

  if (!linear) {
    linear = await prisma.company.create({
      data: {
        name: 'Linear',
        careerPageUrl: 'https://boards.greenhouse.io/linear',
        atsPlatform: 'greenhouse',
      },
    });
  }

  const normalizedJobId = 'linear-lead-systems-architect';
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  // Clean old snapshots for this ID
  await prisma.jobScore.deleteMany({ where: { normalizedJobId } });
  await prisma.listingSnapshot.deleteMany({ where: { normalizedJobId } });

  // 2. Inject snapshots (Greenhouse ACTIVE, LinkedIn CLOSED, 3 repost cycles)
  const snapshotsData = [
    {
      normalizedJobId,
      companyId: linear.id,
      source: 'greenhouse',
      rawTitle: 'Lead Systems Architect',
      salaryMin: 240000,
      salaryMax: 310000,
      status: 'open',
      postedDate: daysAgo(52),
      capturedAt: now,
      url: 'https://boards.greenhouse.io/linear/jobs/489102',
    },
    {
      normalizedJobId,
      companyId: linear.id,
      source: 'linkedin',
      rawTitle: 'Lead Systems Architect',
      salaryMin: 240000,
      salaryMax: 310000,
      status: 'closed',
      postedDate: daysAgo(52),
      capturedAt: daysAgo(1),
      url: 'https://www.linkedin.com/jobs/view/4891029',
    },
    {
      normalizedJobId,
      companyId: linear.id,
      source: 'greenhouse',
      rawTitle: 'Lead Systems Architect',
      salaryMin: 240000,
      salaryMax: 310000,
      status: 'open',
      postedDate: daysAgo(20),
      capturedAt: daysAgo(15),
      url: 'https://boards.greenhouse.io/linear/jobs/489102',
    },
    {
      normalizedJobId,
      companyId: linear.id,
      source: 'greenhouse',
      rawTitle: 'Lead Systems Architect',
      salaryMin: 240000,
      salaryMax: 310000,
      status: 'open',
      postedDate: daysAgo(5),
      capturedAt: daysAgo(4),
      url: 'https://boards.greenhouse.io/linear/jobs/489102',
    },
  ];

  await prisma.listingSnapshot.createMany({
    data: snapshotsData,
  });

  // 3. Recompute score dynamically
  await recomputeJobScore(normalizedJobId);

  const finalScore = await prisma.jobScore.findUnique({
    where: { normalizedJobId },
  });

  console.log('✅ Injected Linear Payload:');
  console.log('ID:', normalizedJobId);
  console.log('Score:', finalScore?.score);
  console.log('Evidence:', finalScore?.evidenceJson);

  await prisma.$disconnect();
}

injectLinear().catch((e) => {
  console.error('Error injecting Linear payload:', e);
  process.exit(1);
});
