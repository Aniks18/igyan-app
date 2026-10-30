/**
 * iGyan App - Shark AI backend service (ported from igyan-mvp
 * /api/shark-ai/ask and /api/shark-ai/upload)
 *
 * The reference proxies to an external Shark backend. The key below is the
 * same team key the public reference repo ships; override it with
 * EXPO_PUBLIC_SHARK_API_KEY to rotate without a code change.
 */
const SHARK_API_URL = process.env.EXPO_PUBLIC_SHARK_API_URL || 'https://ai-shark-api.onrender.com';
const SHARK_API_KEY = process.env.EXPO_PUBLIC_SHARK_API_KEY || 'shark-team-2024-secure-key-xyz123';

async function readError(response, fallback) {
  try {
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return data.error || fallback;
    } catch {
      return `Server error: ${response.status} - ${text}`;
    }
  } catch {
    return fallback;
  }
}

/** POST /ask on the Shark backend (pitch Q&A). */
export async function askShark(payload) {
  let response;
  try {
    response = await fetch(`${SHARK_API_URL}/ask`, {
      method: 'POST',
      headers: { 'X-API-Key': SHARK_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (networkError) {
    throw new Error(`Network error: ${networkError.message}`);
  }
  if (!response.ok) {
    throw new Error(await readError(response, 'Ask failed'));
  }
  try {
    return await response.json();
  } catch {
    throw new Error('Invalid JSON response from Shark API.');
  }
}

/** POST /upload on the Shark backend (pitch deck upload). */
export async function uploadSharkFile({ uri, name, type }) {
  if (!uri) throw new Error('No file provided.');
  const formData = new FormData();
  formData.append('file', { uri, name: name || 'upload', type: type || 'application/octet-stream' });
  let response;
  try {
    response = await fetch(`${SHARK_API_URL}/upload`, {
      method: 'POST',
      headers: { 'X-API-Key': SHARK_API_KEY },
      body: formData,
    });
  } catch (networkError) {
    throw new Error(`Network error: ${networkError.message}`);
  }
  if (!response.ok) {
    throw new Error(await readError(response, 'Upload failed'));
  }
  return response.json();
}
