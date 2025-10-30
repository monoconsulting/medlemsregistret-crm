/**
 * backend/src/config/ai.ts
 * AI feature configuration
 */

export const aiConfig = {
  ENABLE_AI: process.env.ENABLE_AI === 'true',
  AI_PROVIDER: process.env.AI_PROVIDER || 'none',
  AI_API_KEY: process.env.AI_API_KEY || '',
};

export function isAiEnabled(): boolean {
  return aiConfig.ENABLE_AI && aiConfig.AI_PROVIDER !== 'none' && !!aiConfig.AI_API_KEY;
}
