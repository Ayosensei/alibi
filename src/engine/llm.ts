import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export type LLMGenerateFn = (params: {
  prompt: string;
  isRetry: boolean;
}) => Promise<{ reply: string; claimIds: string[] }>;

let customLLM: LLMGenerateFn | null = null;
let llmCallCount = 0;

export function setCustomLLM(fn: LLMGenerateFn | null) {
  customLLM = fn;
}

export function resetLLMCallCount() {
  llmCallCount = 0;
}

export function getLLMCallCount(): number {
  return llmCallCount;
}

export async function callSuspectLLM(params: {
  prompt: string;
  isRetry: boolean;
}): Promise<{ reply: string; claimIds: string[] } | null> {
  const maxCalls = Number(process.env.ALIBI_MAX_LLM_CALLS || 60);
  if (llmCallCount >= maxCalls) {
    return null;
  }

  if (process.env.ALIBI_LLM === 'off') {
    return null;
  }

  if (customLLM) {
    llmCallCount++;
    return customLLM(params);
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const google = createGoogleGenerativeAI({ apiKey });

  try {
    llmCallCount++;
    const { object } = await generateObject({
      model: google(modelName),
      schema: z.object({
        reply: z.string(),
        claimIds: z.array(z.string()),
      }),
      prompt: params.prompt,
    });
    return object;
  } catch {
    return null;
  }
}
