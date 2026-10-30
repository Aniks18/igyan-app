/**
 * iGyan App - Content generator service (ported from igyan-mvp
 * /api/content-generator). Returns the model's JSON-mode reply as text;
 * callers parse it for their content type (pitch decks, notes, etc.).
 */
import { chatCompletion } from './aiClient';

export async function generateContent(messages, contentType) {
  const content = await chatCompletion({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.7,
    maxTokens: contentType === 'shark-ppt' ? 3000 : 2000,
    jsonMode: true,
  });
  if (!content) throw new Error('The AI service returned an empty response.');
  return { content };
}
