/**
 * iGyan App - Gyani Sage service (ported from igyan-mvp /api/gyanisage)
 *
 * Two modes: plain Q&A ('answer') and career roadmap ('career', JSON).
 */
import { chatCompletion } from './aiClient';
import { buildSageMessages, parseJsonLoose } from './apiUtils';

export async function askSage({ mode, shortName, question, history = [], systemPrompt } = {}) {
  if (!question?.trim()) throw new Error('A message is required.');
  const { messages, isCareer } = buildSageMessages({ mode, shortName, question, history, systemPrompt });
  const content = await chatCompletion({
    model: 'gpt-4o-mini',
    messages,
    temperature: isCareer ? 0.7 : 0.8,
    maxTokens: isCareer ? 2000 : 1500,
    jsonMode: isCareer,
  });
  if (isCareer) {
    try {
      return { roadmap: parseJsonLoose(content) };
    } catch {
      throw new Error('Failed to parse career roadmap. Please try again.');
    }
  }
  return { answer: content };
}
