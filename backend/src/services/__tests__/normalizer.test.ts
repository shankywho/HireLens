import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeJob } from '../normalizer';

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      public models = {
        generateContent: mockGenerateContent,
      };
      constructor(_opts?: { apiKey: string }) {}
    },
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      NUMBER: 'NUMBER',
    },
  };
});

describe('HireLens Title Normalizer Service', () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
  });

  it('should normalize valid title via Gemini structured output', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        normalized_id: 'stripe-senior-infrastructure',
        confidence: 0.96,
        reasoning: 'Normalized Senior Staff to senior level in infrastructure domain',
      }),
    });

    const result = await normalizeJob('Stripe', 'Senior Infrastructure Engineer', 'San Francisco, CA');
    expect(result.normalized_id).toBe('stripe-senior-infrastructure');
    expect(result.confidence).toBe(0.96);
    expect(result.reasoning).toContain('infrastructure domain');
  });

  it('should apply fallback when Gemini confidence is below 0.85 threshold', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        normalized_id: 'coinbase-staff-crypto',
        confidence: 0.72,
        reasoning: 'Ambiguous title requirements',
      }),
    });

    const result = await normalizeJob('Coinbase', 'Lead Web3 Wizard', 'Remote');
    expect(result.normalized_id).toBe('coinbase-unconfirmed-lead-web3-wizard');
    expect(result.confidence).toBe(0.72);
    expect(result.reasoning).toContain('Low confidence match');
  });

  it('should recover with fallback when Gemini API throws an error or times out', async () => {
    mockGenerateContent.mockRejectedValueOnce(
      new Error('API quota exceeded or network timeout')
    );

    const result = await normalizeJob('DoorDash', 'Senior Dispatch Specialist', 'Seattle, WA');
    expect(result.normalized_id).toBe('doordash-l_unspecified-senior-dispatch-specialist');
    expect(result.confidence).toBe(0.0);
    expect(result.reasoning).toContain('Gemini Normalization fallback triggered');
  });
});
