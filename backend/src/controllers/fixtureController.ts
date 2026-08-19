import { Request, Response } from 'express';

/**
 * Serves the baseline HTML fixture (v1 DOM) representing a pristine Greenhouse requisition layout.
 *
 * @param _req - Express Request
 * @param res - Express Response
 */
export function getFixtureV1(_req: Request, res: Response): void {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Greenhouse Job Posting - Baseline v1</title>
    </head>
    <body>
      <div id="app">
        <h1 class="job-title">Software Engineer II, Infrastructure</h1>
        <div class="location">San Francisco, CA</div>
        <div class="salary-range">$160,000 - $210,000</div>
        <div class="status-badge">Open</div>
      </div>
    </body>
    </html>
  `);
}

/**
 * Serves the mutated HTML fixture (v2 DOM) representing a drifted Greenhouse layout to trigger self-healing.
 *
 * @param _req - Express Request
 * @param res - Express Response
 */
export function getFixtureV2(_req: Request, res: Response): void {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Greenhouse Job Posting - Drifted Selector v2</title>
    </head>
    <body>
      <div id="app">
        <!-- Selector drifted from h1.job-title to div[data-job-header="title"] -->
        <div data-job-header="title">Software Engineer II, Infrastructure</div>
        <div class="location">San Francisco, CA</div>
        <div data-salary-bound="range">$160,000 - $210,000</div>
        <span class="posting-state">Open</span>
      </div>
    </body>
    </html>
  `);
}
