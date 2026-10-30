/**
 * iGyan App - Shared OpenAI client (ported from igyan-mvp API routes)
 *
 * The reference app calls OpenAI from Next.js API routes. In Expo there is
 * no server, so screens and services call the API directly with
 * EXPO_PUBLIC_OPENAI_API_KEY. Missing key maps to the reference 503 shape.
 */
import { getOpenAIKey, parseJsonLoose } from './apiUtils';

const CHAT_URL = 'https://api.openai.com/v1/chat/completions';

function toError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

/** Raw chat completion; returns the assistant content string. */
export async function chatCompletion({
  messages,
  model = 'gpt-4o-mini',
  temperature = 0.7,
  maxTokens = 1500,
  jsonMode = false,
  timeoutMs = 60000,
} = {}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw toError(400, 'Content instructions are required.');
  }
  const apiKey = getOpenAIKey();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  let data;
  try {
    response = await fetch(CHAT_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
    data = await response.json();
  } catch (networkError) {
    if (controller.signal.aborted) {
      throw toError(408, 'The AI request timed out. Please try again.');
    }
    if (networkError instanceof SyntaxError) {
      throw toError(response?.status || 500, 'The AI service returned an invalid response. Please try again.');
    }
    throw toError(0, `Network error: ${networkError.message}`);
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    const detail = data?.error?.message || '';
    if (response.status === 401) {
      throw toError(401, 'Invalid OpenAI API key. Please check your configuration.');
    }
    throw toError(response.status, detail || 'Unable to get a response right now. Please try again.');
  }
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw toError(500, 'The AI service returned an empty response.');
  return content;
}

/** Chat completion parsed as JSON (tolerant of markdown fences). */
export async function chatCompletionJson(options) {
  const content = await chatCompletion({ ...options, jsonMode: true });
  try {
    return parseJsonLoose(content);
  } catch {
    throw toError(500, 'Failed to parse AI response. Please try again.');
  }
}
