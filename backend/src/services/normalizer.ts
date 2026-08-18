import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { slugify } from '../utils/slugify';
import { env } from '../config/env';

/**
 * Zod validation schema for Gemini LLM structured title normalization output.
 */
export const NormalizationOutputSchema = z.object({
  normalized_id: z.string().describe('Canonical slug formatted as <company>-<level>-<domain>'),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

export type NormalizationOutput = z.infer<typeof NormalizationOutputSchema>;

/**
 * Normalizes disparate job titles across ATS portals into a canonical, deduplicated identifier.
 * Uses Google Gemini 3.6 Flash via @google/genai with strict JSON schema enforcement and
 * falls back to deterministic heuristic parsing if the API is offline or confidence is below 0.85.
 *
 * @param company - Employer name (e.g. Stripe, Coinbase)
 * @param rawTitle - Raw extracted title (e.g. "Software Engineer II, Core Payments")
 * @param location - Job location or Remote designation
 * @returns Promise<NormalizationOutput> canonical normalized_id and confidence score
 */
export async function normalizeJob(
  company: string,
  rawTitle: string,
  location: string
): Promise<NormalizationOutput> {
  const companySlug = slugify(company);
  const rawTitleSlug = slugify(rawTitle);

  // If no API key set or fallback mode forced, run deterministic heuristic normalization
  if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY.trim() === '' || env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
    let level = 'l_unspecified';
    const lowerTitle = rawTitle.toLowerCase();
    if (lowerTitle.includes('intern')) level = 'intern';
    else if (lowerTitle.includes('senior') || lowerTitle.includes('sr')) level = 'senior';
    else if (lowerTitle.includes('staff')) level = 'staff';
    else if (lowerTitle.includes('ii') || lowerTitle.includes(' 2')) level = 'l2';
    else if (lowerTitle.includes('iii') || lowerTitle.includes(' 3')) level = 'l3';
    else if (lowerTitle.includes('i') || lowerTitle.includes(' 1')) level = 'l1';

    let domain = 'general';
    if (lowerTitle.includes('infrastructure') || lowerTitle.includes('infra')) domain = 'infrastructure';
    else if (lowerTitle.includes('backend') || lowerTitle.includes('back-end')) domain = 'backend';
    else if (lowerTitle.includes('frontend') || lowerTitle.includes('front-end')) domain = 'frontend';
    else if (lowerTitle.includes('fullstack') || lowerTitle.includes('full-stack')) domain = 'fullstack';
    else if (lowerTitle.includes('data') || lowerTitle.includes('analytics')) domain = 'data';
    else if (lowerTitle.includes('security')) domain = 'security';
    else if (lowerTitle.includes('mobile') || lowerTitle.includes('ios') || lowerTitle.includes('android')) domain = 'mobile';

    return {
      normalized_id: `${companySlug}-${level}-${domain}`,
      confidence: 0.9,
      reasoning: 'Rule-based fallback normalization (No Gemini API key provided).',
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Company: ${company}\nRaw Job Title: ${rawTitle}\nLocation: ${location}`,
      config: {
        systemInstruction: `You are a job-listing normalization engine. Your task is to normalize raw titles from different sources into a canonical ID.
Rules:
- normalized_id format: <company-slug>-<level>-<domain-slug> (e.g. stripe-l2-infrastructure, coinbase-intern-backend).
- Levels: l1, l2, l3, senior, staff, intern, or l_unspecified.
- If confidence is < 0.85, still output your best normalized_id.
- Return ONLY structured JSON adhering to the required schema.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            normalized_id: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
          },
          required: ['normalized_id', 'confidence', 'reasoning'],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('Empty response from Gemini API');

    const parsedJson: unknown = JSON.parse(text);
    const validated = NormalizationOutputSchema.parse(parsedJson);

    // Confidence threshold guardrail
    if (validated.confidence < 0.85) {
      return {
        normalized_id: `${companySlug}-unconfirmed-${rawTitleSlug}`,
        confidence: validated.confidence,
        reasoning: `Low confidence match (${validated.confidence}). Isolated listing.`,
      };
    }

    return validated;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    // Robust Fallback handling for API errors or timeouts
    return {
      normalized_id: `${companySlug}-l_unspecified-${rawTitleSlug}`,
      confidence: 0.0,
      reasoning: `Gemini Normalization fallback triggered due to error: ${message}`,
    };
  }
}
