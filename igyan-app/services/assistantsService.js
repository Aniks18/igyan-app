/**
 * iGyan App - OpenAI Assistants service (ported from igyan-mvp
 * /api/extract-pdf and /api/shark-ai-chat)
 *
 * Flow: preparePdfAssistant() uploads a PDF, creates an assistant backed by
 * a file-search vector store, and returns ids. askAssistant() posts a
 * question on a thread and polls the run to completion.
 */
import { getOpenAIKey } from './apiUtils';

const OPENAI_BASE = 'https://api.openai.com/v1';
const BETA_HEADERS = { 'OpenAI-Beta': 'assistants=v2' };

function authHeaders(apiKey, extra) {
  return { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', ...extra };
}

async function openaiFetch(apiKey, path, options = {}) {
  let response;
  try {
    response = await fetch(`${OPENAI_BASE}${path}`, {
      ...options,
      headers: authHeaders(apiKey, { ...BETA_HEADERS, ...(options.headers || {}) }),
    });
  } catch (networkError) {
    throw new Error(`Network error: ${networkError.message}`);
  }
  if (response.status === 401) {
    throw new Error('Invalid OpenAI API key. Please check your configuration.');
  }
  if (!response.ok) {
    let detail = '';
    try {
      const data = await response.json();
      detail = data?.error?.message || '';
    } catch {
      detail = '';
    }
    throw new Error(detail || `OpenAI request failed (${response.status}).`);
  }
  return response.json();
}

/**
 * Upload a PDF and prepare a file-search assistant + thread.
 * Returns { fileId, assistantId, threadId, fileName }.
 */
export async function preparePdfAssistant({ uri, name, type }) {
  if (!uri) throw new Error('No file provided.');
  const apiKey = getOpenAIKey();

  const formData = new FormData();
  formData.append('file', { uri, name: name || 'document.pdf', type: type || 'application/pdf' });
  formData.append('purpose', 'assistants');
  let uploadResponse;
  try {
    uploadResponse = await fetch(`${OPENAI_BASE}/files`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, ...BETA_HEADERS },
      body: formData,
    });
  } catch (networkError) {
    throw new Error(`Network error: ${networkError.message}`);
  }
  if (!uploadResponse.ok) throw new Error('Failed to upload file to OpenAI.');
  const uploadedFile = await uploadResponse.json();

  const assistant = await openaiFetch(apiKey, '/assistants', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Shark AI - PDF Q&A Assistant',
      instructions:
        'You are Shark AI, an intelligent document analysis assistant for igyan education platform. ' +
        'Answer questions accurately based on the uploaded PDF file. Provide clear, concise, and helpful ' +
        'responses. Quote relevant sections when appropriate. Admit when information is not in the document. ' +
        'Be educational and supportive in your tone.',
      model: 'gpt-4o-mini',
      tools: [{ type: 'file_search' }],
    }),
  });

  const vectorStore = await openaiFetch(apiKey, '/vector_stores', {
    method: 'POST',
    body: JSON.stringify({ name: 'Shark AI Document Store' }),
  });

  await openaiFetch(apiKey, `/vector_stores/${vectorStore.id}/files`, {
    method: 'POST',
    body: JSON.stringify({ file_id: uploadedFile.id }),
  });

  const thread = await openaiFetch(apiKey, '/threads', {
    method: 'POST',
    body: JSON.stringify({
      tool_resources: { file_search: { vector_store_ids: [vectorStore.id] } },
    }),
  });

  return {
    fileId: uploadedFile.id,
    assistantId: assistant.id,
    threadId: thread.id,
    fileName: name || 'document.pdf',
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Ask a question on an existing assistant thread. Polls the run until it
 * completes (2s interval, 120s cap — the reference polls without a cap).
 * Returns { answer }.
 */
export async function askAssistant({ assistantId, threadId, question, pollIntervalMs = 2000, maxWaitMs = 120000 }) {
  if (!assistantId || !threadId || !question) {
    throw new Error('Missing required fields.');
  }
  const apiKey = getOpenAIKey();

  await openaiFetch(apiKey, `/threads/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ role: 'user', content: question }),
  });

  const run = await openaiFetch(apiKey, `/threads/${threadId}/runs`, {
    method: 'POST',
    body: JSON.stringify({ assistant_id: assistantId }),
  });

  const deadline = Date.now() + maxWaitMs;
  let runStatus = run;
  while (runStatus.status !== 'completed') {
    if (['failed', 'cancelled', 'expired'].includes(runStatus.status)) {
      throw new Error(`Run ${runStatus.status}.`);
    }
    if (Date.now() > deadline) throw new Error('Assistant run timed out. Please try again.');
    await sleep(pollIntervalMs);
    runStatus = await openaiFetch(apiKey, `/threads/${threadId}/runs/${run.id}`, { method: 'GET' });
  }

  const messages = await openaiFetch(apiKey, `/threads/${threadId}/messages?limit=1&order=desc`, { method: 'GET' });
  const lastMessage = messages?.data?.[0];
  const answer = lastMessage?.content?.[0]?.text?.value;
  if (!answer) throw new Error('The AI service returned an empty response.');
  return { answer };
}
