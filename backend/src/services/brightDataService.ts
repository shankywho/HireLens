import { exec } from 'child_process';
import { promisify } from 'util';
import { RawScrapedJob, AtsSource, HealResult, ApproveResult } from '../types';
import { env } from '../config/env';

const execAsync = promisify(exec);

/**
 * Bright Data Integration Service
 * Executes real Scraper Studio CLI commands (`bdata scraper run`, `bdata scraper heal`, `bdata scraper approve`)
 * authenticated via the BRIGHTDATA_API_KEY environment variable.
 */
export class BrightDataService {
  /**
   * Resolves a target scrape URL from employer name and ATS source.
   */
  private static resolveTargetUrl(company: string, sourceType: string): string {
    const slug = company.toLowerCase().replace(/[^a-z0-9]/g, '');
    const source = sourceType.toLowerCase();

    if (source.includes('greenhouse')) return `https://boards.greenhouse.io/${slug}`;
    if (source.includes('lever')) return `https://jobs.lever.co/${slug}`;
    if (source.includes('linkedin')) return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(company)}`;
    if (source.includes('indeed')) return `https://www.indeed.com/jobs?q=${encodeURIComponent(company)}`;

    return `https://boards.greenhouse.io/${slug}`;
  }

  /**
   * Executes a scraper collector for a specific target company and source platform.
   * Runs: `bdata scraper run <collector_id> <url> --json`
   *
   * @param collectorId - The identifier of the scraping collector (e.g. c_greenhouse)
   * @param company - Target employer name
   * @param sourceType - ATS platform type (greenhouse, lever, linkedin, indeed)
   * @param targetUrl - Optional explicit target URL (e.g. local fixture URL for demo testing)
   * @returns Promise<RawScrapedJob[]> array of raw extracted job listings
   */
  public static async runCollector(
    collectorId: string,
    company: string,
    sourceType: string,
    targetUrl?: string
  ): Promise<RawScrapedJob[]> {
    if (env.USE_SYNTHETIC_SCRAPER) {
      return this.getSyntheticScrapedJobs(company, sourceType);
    }

    const apiKey = env.BRIGHTDATA_API_KEY || process.env.BRIGHTDATA_API_KEY || '';
    const finalUrl = targetUrl || this.resolveTargetUrl(company, sourceType);
    const command = `npx -y bdata scraper run ${collectorId} "${finalUrl}" --json`;

    console.log(`[BRIGHTDATA CLI] Executing: ${command}`);
    const { stdout, stderr } = await execAsync(command, {
      timeout: 60000,
      env: {
        ...process.env,
        BRIGHTDATA_API_KEY: apiKey,
      },
    });

    if (stderr && !stdout) {
      console.error(`[BRIGHTDATA CLI] Run error for ${collectorId}:`, stderr);
      throw new Error(`Bright Data CLI execution failed for collector ${collectorId}: ${stderr}`);
    }

    console.log(`[BRIGHTDATA CLI] Raw stdout for ${collectorId}:`, stdout);

    // Filter out informational progress lines if any before JSON
    const jsonStart = stdout.indexOf('[');
    const objectStart = stdout.indexOf('{');
    const firstJsonIndex = jsonStart !== -1 && (objectStart === -1 || jsonStart < objectStart) ? jsonStart : objectStart;

    if (firstJsonIndex === -1) {
      throw new Error(`[BRIGHTDATA CLI] Unexpected non-JSON response: ${stdout}`);
    }

    const jsonText = stdout.slice(firstJsonIndex);
    const parsed: unknown = JSON.parse(jsonText);
    return Array.isArray(parsed) ? (parsed as RawScrapedJob[]) : ([parsed] as RawScrapedJob[]);
  }

  /**
   * Shells out to the real `bdata` CLI to heal a broken collector:
   * `bdata scraper heal <collector_id> "<prompt>" --json`
   *
   * @param collectorId - Collector identifier requiring AST patch synthesis
   * @param prompt - Diagnostic context or failure description
   * @returns Promise<HealResult> containing verified CLI output envelope awaiting approval
   */
  public static async healCollector(
    collectorId: string,
    prompt: string = 'The job title selector returned null. Fix selector to capture title and location.'
  ): Promise<HealResult> {
    const apiKey = env.BRIGHTDATA_API_KEY || process.env.BRIGHTDATA_API_KEY || '';
    const sanitizedPrompt = prompt.replace(/"/g, '\\"');
    const command = `npx -y bdata scraper heal ${collectorId} "${sanitizedPrompt}" --json`;

    console.log(`[BRIGHTDATA CLI] Executing: ${command}`);
    const { stdout, stderr } = await execAsync(command, {
      timeout: 180000,
      env: {
        ...process.env,
        BRIGHTDATA_API_KEY: apiKey,
      },
    });

    if (stderr && !stdout) {
      console.error(`[BRIGHTDATA CLI] Heal error for ${collectorId}:`, stderr);
      throw new Error(`Bright Data CLI heal failed for collector ${collectorId}: ${stderr}`);
    }

    console.log(`[BRIGHTDATA CLI] Raw heal output for ${collectorId}:`, stdout);

    const jsonStartIndex = stdout.indexOf('{');
    if (jsonStartIndex === -1) {
      throw new Error(`[BRIGHTDATA CLI] Non-JSON output received from heal command: ${stdout}`);
    }

    const jsonText = stdout.slice(jsonStartIndex);
    const parsed = JSON.parse(jsonText) as HealResult;

    return {
      collector_id: parsed.collector_id || collectorId,
      status: parsed.status || 'awaiting_approval',
      completed_steps: parsed.completed_steps || [],
      prompt: parsed.prompt || prompt,
      view_url: parsed.view_url || `https://brightdata.com/cp/scrapers/${collectorId}`,
      next_step: parsed.next_step || `bdata scraper approve ${collectorId}`,
      preview_result: Array.isArray(parsed.preview_result) ? parsed.preview_result : [],
      diff_summary: parsed.diff_summary || 'Proposed template updated — review at view_url',
      rawOutput: stdout,
    };
  }

  /**
   * Shells out to the real `bdata` CLI to approve a synthesized selector patch:
   * `bdata scraper approve <collector_id> --json`
   *
   * @param collectorId - Target collector to approve and restore to live production
   * @returns Promise<ApproveResult> verified approval output
   */
  public static async approveHeal(collectorId: string): Promise<ApproveResult> {
    const apiKey = env.BRIGHTDATA_API_KEY || process.env.BRIGHTDATA_API_KEY || '';
    const command = `npx -y bdata scraper approve ${collectorId} --auto-save --json`;

    console.log(`[BRIGHTDATA CLI] Executing: ${command}`);
    const { stdout, stderr } = await execAsync(command, {
      timeout: 60000,
      env: {
        ...process.env,
        BRIGHTDATA_API_KEY: apiKey,
      },
    });

    if (stderr && !stdout) {
      console.error(`[BRIGHTDATA CLI] Approve error for ${collectorId}:`, stderr);
      throw new Error(`Bright Data CLI approve failed for collector ${collectorId}: ${stderr}`);
    }

    console.log(`[BRIGHTDATA CLI] Raw approve output for ${collectorId}:`, stdout);

    const jsonStartIndex = stdout.indexOf('{');
    if (jsonStartIndex === -1) {
      throw new Error(`[BRIGHTDATA CLI] Non-JSON output received from approve command: ${stdout}`);
    }

    const jsonText = stdout.slice(jsonStartIndex);
    const parsed = JSON.parse(jsonText) as ApproveResult;

    return {
      collector_id: parsed.collector_id || collectorId,
      status: parsed.status || 'done',
      completed_steps: parsed.completed_steps || [],
      prompt: parsed.prompt || '',
      view_url: parsed.view_url || `https://brightdata.com/cp/scrapers/${collectorId}`,
      next_step: parsed.next_step || `bdata scraper run ${collectorId} <url>`,
      rawOutput: stdout,
    };
  }

  /**
   * Realistic synthetic mock fixture generator for seed dataset & offline demo.
   */
  public static getSyntheticScrapedJobs(company: string, sourceType: string): RawScrapedJob[] {
    const today = new Date();
    const ago10Days = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const ago40Days = new Date(today.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString();
    const ago60Days = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

    const mockDatabase: Record<string, RawScrapedJob[]> = {
      Stripe: [
        {
          company: 'Stripe',
          source: 'greenhouse',
          rawTitle: 'Software Engineer II, Infrastructure',
          location: 'San Francisco, CA',
          salaryMin: 160000,
          salaryMax: 210000,
          status: 'open',
          postedDate: ago10Days,
          url: 'https://boards.greenhouse.io/stripe/jobs/4019283',
        },
        {
          company: 'Stripe',
          source: 'linkedin',
          rawTitle: 'Backend SWE - Infrastructure Team',
          location: 'San Francisco, CA',
          salaryMin: 165000,
          salaryMax: 215000,
          status: 'open',
          postedDate: ago10Days,
          url: 'https://www.linkedin.com/jobs/view/3910293',
        },
        {
          company: 'Stripe',
          source: 'indeed',
          rawTitle: 'Software Developer - Infrastructure',
          location: 'San Francisco, CA',
          salaryMin: 140000,
          salaryMax: 220000,
          status: 'open',
          postedDate: ago40Days,
          url: 'https://www.indeed.com/viewjob?jk=8392019',
        },
      ],
      Coinbase: [
        {
          company: 'Coinbase',
          source: 'greenhouse',
          rawTitle: 'Backend Engineer Intern',
          location: 'Remote',
          salaryMin: 55,
          salaryMax: 70,
          status: 'open',
          postedDate: ago10Days,
          url: 'https://boards.greenhouse.io/coinbase/jobs/559102',
        },
        {
          company: 'Coinbase',
          source: 'linkedin',
          rawTitle: 'Software Engineer Intern - Backend',
          location: 'Remote',
          salaryMin: 55,
          salaryMax: 70,
          status: 'closed',
          postedDate: ago10Days,
          url: 'https://www.linkedin.com/jobs/view/1029384',
        },
      ],
      DoorDash: [
        {
          company: 'DoorDash',
          source: 'greenhouse',
          rawTitle: 'Senior Software Engineer, Logistics',
          location: 'Seattle, WA',
          salaryMin: 190000,
          salaryMax: 250000,
          status: 'open',
          postedDate: ago60Days,
          url: 'https://boards.greenhouse.io/doordash/jobs/102938',
        },
      ],
      Linear: [
        {
          company: 'Linear',
          source: 'greenhouse',
          rawTitle: 'Lead Systems Architect',
          location: 'San Francisco, CA',
          salaryMin: 240000,
          salaryMax: 310000,
          status: 'open',
          postedDate: ago10Days,
          url: 'https://boards.greenhouse.io/linear/jobs/992011',
        },
        {
          company: 'Linear',
          source: 'linkedin',
          rawTitle: 'Principal Systems Architect',
          location: 'San Francisco, CA',
          salaryMin: 240000,
          salaryMax: 310000,
          status: 'closed',
          postedDate: ago10Days,
          url: 'https://www.linkedin.com/jobs/view/992012',
        },
      ],
    };

    const validSource: AtsSource =
      sourceType === 'lever' || sourceType === 'linkedin' || sourceType === 'indeed' ? sourceType : 'greenhouse';

    return (
      mockDatabase[company] || [
        {
          company,
          source: validSource,
          rawTitle: 'Software Engineer',
          location: 'Remote',
          salaryMin: 120000,
          salaryMax: 160000,
          status: 'open',
          postedDate: ago10Days,
          url: `https://careers.${company.toLowerCase()}.com/jobs/1`,
        },
      ]
    );
  }
}
