/**
 * backend/src/config/ai.ts
 * Central AI configuration (feature-flagged). No provider SDKs imported here.
 * - Keep ENABLE_AI=false by default.
 * - When enabling: set AI_PROVIDER, AI_API_KEY, AI_MODEL, etc.
 */
import { z } from 'zod';

const AiEnvSchema = z.object({
  ENABLE_AI: z
    .string()
    .optional()
    .transform((v) => String(v).toLowerCase() === 'true'),
  AI_PROVIDER: z.enum(['openai', 'anthropic', 'azure_openai', 'none']).default('none'),
  AI_API_KEY: z.string().optional(),
  AI_API_BASE: z.string().url().optional(), // e.g. Azure OpenAI endpoint
  AI_MODEL: z.string().optional(),          // e.g. gpt-4o-mini / claude-3-5-sonnet / gpt-4o
  AI_TIMEOUT_MS: z.coerce.number().default(30000),
  AI_MAX_TOKENS: z.coerce.number().default(1024),
  AI_RATE_LIMIT_RPM: z.coerce.number().default(60),
});

export type AiConfig = z.infer<typeof AiEnvSchema>;

export const aiConfig: AiConfig = AiEnvSchema.parse({
  ENABLE_AI: process.env.ENABLE_AI ?? 'false',
  AI_PROVIDER: process.env.AI_PROVIDER ?? 'none',
  AI_API_KEY: process.env.AI_API_KEY,
  AI_API_BASE: process.env.AI_API_BASE,
  AI_MODEL: process.env.AI_MODEL,
  AI_TIMEOUT_MS: process.env.AI_TIMEOUT_MS ?? '30000',
  AI_MAX_TOKENS: process.env.AI_MAX_TOKENS ?? '1024',
  AI_RATE_LIMIT_RPM: process.env.AI_RATE_LIMIT_RPM ?? '60',
});

// Helper: is AI fully usable?
export const isAiEnabled = (): boolean => {
  if (!aiConfig.ENABLE_AI) return false;
  if (aiConfig.AI_PROVIDER === 'none') return false;
  if (!aiConfig.AI_API_KEY) return false;
  if (!aiConfig.AI_MODEL) return false;
  // For Azure OpenAI you typically also need AI_API_BASE
  if (aiConfig.AI_PROVIDER === 'azure_openai' && !aiConfig.AI_API_BASE) return false;
  return true;
};
