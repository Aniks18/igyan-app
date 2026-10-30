/**
 * iGyan App - Substitute reasoning service (ported from igyan-mvp
 * /api/openai-reasoning)
 *
 * Explains a faculty substitution decision. Never throws for a missing key
 * or a failed call — it falls back to the reference canned reasoning so the
 * timetable UI always has something to show.
 */
import { SUBSTITUTE_FALLBACK_REASONING, SUBSTITUTE_FALLBACK_SHORT } from './apiUtils';

const SYSTEM_PROMPT =
  'You are an educational administrator assistant. Provide concise, professional explanations ' +
  'for faculty substitution decisions. Keep responses to 2-3 sentences maximum.';

export async function explainSubstitution(prompt) {
  if (!prompt) throw new Error('Prompt is required.');
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) return { reasoning: SUBSTITUTE_FALLBACK_REASONING };
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });
    if (!response.ok) return { reasoning: SUBSTITUTE_FALLBACK_REASONING };
    const data = await response.json();
    return {
      reasoning:
        data?.choices?.[0]?.message?.content?.trim() || SUBSTITUTE_FALLBACK_SHORT,
    };
  } catch {
    return { reasoning: SUBSTITUTE_FALLBACK_REASONING };
  }
}
