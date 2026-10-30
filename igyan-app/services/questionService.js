/**
 * iGyan App - Question generation service (ported from igyan-mvp
 * /api/generate-questions: MCQ, viva, and CBSE question-paper modes)
 */
import { chatCompletion } from './aiClient';
import { buildMcqPrompts, buildVivaPrompts, buildQuestionPaperSystemPrompt, parseJsonLoose } from './apiUtils';

function withIds(questions) {
  return (Array.isArray(questions) ? questions : []).map((q) => ({
    ...q,
    id: q?.id ?? Date.now() + Math.random(),
  }));
}

/**
 * Generate structured questions.
 * { topic, numQuestions, questionType: 'mcq'|'viva', subject, classLevel,
 *   difficulty, language, bloomsLevel } -> { questions }
 */
export async function generateQuestions({ topic, numQuestions, questionType, subject, classLevel, difficulty, language, bloomsLevel } = {}) {
  if (!topic) throw new Error('Topic is required.');
  const builders = questionType === 'mcq' ? buildMcqPrompts : buildVivaPrompts;
  const { systemPrompt, userPrompt } = builders({ topic, numQuestions, subject, classLevel, difficulty, language, bloomsLevel });
  const content = await chatCompletion({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    maxTokens: 2000,
  });
  let questions;
  try {
    questions = parseJsonLoose(content.trim());
  } catch {
    throw new Error('Failed to parse AI response. Please try again.');
  }
  return { questions: withIds(questions) };
}

/** Generate a CBSE-style question paper from a free-form prompt. -> { content } */
export async function generateQuestionPaper(prompt) {
  if (!prompt) throw new Error('Prompt is required.');
  const content = await chatCompletion({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: buildQuestionPaperSystemPrompt() },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    maxTokens: 3000,
  });
  return { content: content.trim() };
}
