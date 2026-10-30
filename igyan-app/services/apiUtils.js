/**
 * iGyan App - Reference API pure utilities (ported from igyan-mvp)
 *
 * Dependency-free helpers shared by the service layer. Kept in CommonJS so
 * the repo's node:test suite can require this file directly, and so ESM
 * services can import the named helpers.
 */

function cleanPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return digits.slice(2);
  if (digits.length === 10) return digits;
  return digits;
}

function isValidIndianMobile(phone) {
  return cleanPhone(phone).length === 10;
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function formatWhatsAppReceiver(phone) {
  return `91${cleanPhone(phone)}`;
}

function buildSlug(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Strip markdown fences and parse JSON. Mirrors the reference
 * generate-questions route's tolerant parsing.
 */
function parseJsonLoose(content) {
  const clean = String(content || '')
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  return JSON.parse(clean);
}

function parseQuiz(content, questionCount) {
  let quiz;
  try {
    quiz = parseJsonLoose(content);
  } catch {
    throw new Error('The AI returned an invalid quiz. Please generate it again.');
  }
  const text = value => typeof value === 'string' && value.trim().length > 0;
  const questions = quiz?.questions;
  if (!text(quiz?.title) || !text(quiz?.description) || !Array.isArray(questions) ||
      questions.length !== Number(questionCount) || questions.length === 0 ||
      new Set(questions.map(q => q?.id)).size !== questions.length ||
      !questions.every(q => Number.isInteger(q?.id) && q.id > 0 && text(q.question) && text(q.explanation) &&
        Array.isArray(q.options) && q.options.length === 4 &&
        new Set(q.options.map(o => o?.id)).size === 4 &&
        q.options.every(o => o && ['A', 'B', 'C', 'D'].includes(o.id) && text(o.text)) &&
        q.options.some(o => o.id === q.correctAnswer))) {
    throw new Error('The AI returned an incomplete quiz. Please generate it again.');
  }
  return quiz;
}

function remainingAttemptsText(record) {
  const remaining = (record.max_attempts || 0) - (record.attempts || 0) - 1;
  return `Incorrect OTP. ${remaining} attempt(s) remaining.`;
}

// ─── Access control ─────────────────────────────────────────────
// Ported from igyan-mvp access_control.js hierarchy semantics.

const ACCESS_RANKS = { view: 1, edit: 2, delete: 3, all: 4 };

function hasRequiredAccess(accessType, requiredAccess) {
  if (accessType === 'all') return true;
  if (!accessType || accessType === 'none') return false;
  const have = ACCESS_RANKS[accessType] || 0;
  const need = ACCESS_RANKS[requiredAccess] || 1;
  return have >= need;
}

function canPerformAction(accessType, action) {
  if (accessType === 'all') return true;
  if (!accessType || accessType === 'none') return false;
  switch (action) {
    case 'view':
      return ['view', 'edit', 'delete', 'all'].includes(accessType);
    case 'edit':
      return ['edit', 'delete', 'all'].includes(accessType);
    case 'delete':
      return ['delete', 'all'].includes(accessType);
    default:
      return false;
  }
}

function getAccessLevelPure(user, moduleName, userAccess) {
  if (!user) return 'none';
  if (user.role === 'super_admin') return 'all';
  return (userAccess || {})[moduleName] || 'none';
}

// Default module grants per role (ported from grantDefaultAccess).
const DEFAULT_ROLE_ACCESS = {
  student: [
    { module: 'Dashboard', access: 'view' },
    { module: 'My Courses', access: 'view' },
    { module: 'AI Copilot', access: 'all' },
    { module: 'Viva AI', access: 'all' },
    { module: 'Assignments', access: 'view' },
    { module: 'Performance', access: 'view' },
    { module: 'Calendar', access: 'view' },
    { module: 'Messages', access: 'all' },
    { module: 'Profile', access: 'edit' },
  ],
  faculty: [
    { module: 'Dashboard', access: 'view' },
    { module: 'My Courses', access: 'all' },
    { module: 'AI Copilot', access: 'all' },
    { module: 'Viva AI', access: 'all' },
    { module: 'Assignments', access: 'all' },
    { module: 'Performance', access: 'view' },
    { module: 'Calendar', access: 'all' },
    { module: 'Messages', access: 'all' },
    { module: 'Student Management', access: 'all' },
    { module: 'Attendance', access: 'all' },
    { module: 'Profile', access: 'edit' },
    { module: 'School Profile', access: 'view' },
  ],
  co_admin: [
    { module: 'Dashboard', access: 'all' },
    { module: 'My Courses', access: 'all' },
    { module: 'AI Copilot', access: 'all' },
    { module: 'Viva AI', access: 'all' },
    { module: 'Assignments', access: 'all' },
    { module: 'Performance', access: 'all' },
    { module: 'Calendar', access: 'all' },
    { module: 'Messages', access: 'all' },
    { module: 'User Management', access: 'view' },
    { module: 'Student Management', access: 'all' },
    { module: 'Attendance', access: 'all' },
    { module: 'Settings', access: 'edit' },
    { module: 'Profile', access: 'edit' },
    { module: 'School Profile', access: 'edit' },
  ],
};

// ─── Question generation prompts (ported from generate-questions) ───

function buildMcqPrompts({ topic, numQuestions, subject, classLevel, difficulty, language, bloomsLevel }) {
  const classLabel = classLevel ? `Class ${classLevel}` : 'general level';
  const difficultyLabel = difficulty || 'medium';
  const langLabel = language || 'English';
  const bloomsLabel = bloomsLevel || 'understanding';
  const systemPrompt =
    `You are an expert educator specializing in creating high-quality multiple-choice questions ` +
    `for ${classLabel} students. Tailor the complexity, vocabulary, and depth of questions to be ` +
    `appropriate for ${classLabel} students. Create questions that test deep understanding, not just ` +
    `memorization. Each question should be clear, unambiguous, and have exactly 4 options with only ` +
    `one correct answer. Generate all questions in ${langLabel}.`;
  const userPrompt =
    `Create ${numQuestions} multiple-choice questions with the following specifications:\n\n` +
    `Subject: ${subject}\nTopic: "${topic}"\nClass/Grade: ${classLabel}\n` +
    `Difficulty: ${difficultyLabel}\nCognitive Level (Bloom's Taxonomy): ${bloomsLabel}\nLanguage: ${langLabel}\n\n` +
    `STRICT FORMAT REQUIREMENTS:\nReturn ONLY a valid JSON array with NO markdown, NO code blocks, NO explanations. Just raw JSON.\n\n` +
    `Format:\n[{ "question": "Question text here?", "options": ["Option A", "Option B", "Option C", "Option D"], ` +
    `"correct_answer": 0, "marks": 1 }]\n\nRules:\n- correct_answer is the index (0-3) of the correct option\n` +
    `- ALL questions must be at ${difficultyLabel} difficulty level appropriate for ${classLabel}\n` +
    `- Questions must target the "${bloomsLabel}" level of Bloom's Taxonomy\n` +
    `- Ensure options are plausible but only one is correct\n- Generate questions in ${langLabel}\n- Each question worth 1 mark`;
  return { systemPrompt, userPrompt };
}

function buildVivaPrompts({ topic, numQuestions, subject, classLevel, difficulty, language, bloomsLevel }) {
  const classLabel = classLevel ? `Class ${classLevel}` : 'general level';
  const difficultyLabel = difficulty || 'medium';
  const langLabel = language || 'English';
  const bloomsLabel = bloomsLevel || 'understanding';
  const systemPrompt =
    `You are an expert educator specializing in creating thoughtful viva (oral examination) questions ` +
    `for ${classLabel} students. Create open-ended questions that encourage critical thinking, application ` +
    `of knowledge, and verbal expression. Tailor the complexity to ${classLabel} level. Include suggested ` +
    `comprehensive answers. Generate all questions in ${langLabel}.`;
  const userPrompt =
    `Create ${numQuestions} viva (oral examination) questions with the following specifications:\n\n` +
    `Subject: ${subject}\nTopic: "${topic}"\nClass/Grade: ${classLabel}\n` +
    `Difficulty: ${difficultyLabel}\nCognitive Level (Bloom's Taxonomy): ${bloomsLabel}\nLanguage: ${langLabel}\n\n` +
    `STRICT FORMAT REQUIREMENTS:\nReturn ONLY a valid JSON array with NO markdown, NO code blocks, NO explanations. Just raw JSON.\n\n` +
    `Format:\n[{ "question": "Question text here?", ` +
    `"suggested_answer": "Comprehensive answer covering key points...", "marks": 5 }]\n\nRules:\n` +
    `- Questions should be open-ended and age-appropriate for ${classLabel}\n` +
    `- Suggested answers should be comprehensive (2-3 sentences minimum)\n` +
    `- Questions must target the "${bloomsLabel}" level of Bloom's Taxonomy\n` +
    `- Focus on "why" and "how" questions\n- Generate questions in ${langLabel}\n- Each question worth 5 marks`;
  return { systemPrompt, userPrompt };
}

function buildQuestionPaperSystemPrompt() {
  return 'You are an expert educator specializing in creating professional CBSE question papers. ' +
    'Generate well-formatted question papers with proper sections, instructions, and marking schemes.';
}

// ─── Gyani Sage prompts (ported from gyanisage) ───

function buildCareerSystemPrompt(name) {
  return `You are ${name}, an expert career counsellor and roadmap planner. Return a detailed career ` +
    `roadmap as JSON with title, overview, duration, phases, and tips. Each phase must include phase, ` +
    `duration, goals, skills, resources, and milestones. Create 4-6 phases with clear progression.`;
}

function buildSageMessages({ mode, shortName, question, history, systemPrompt }) {
  const isCareer = mode === 'career';
  const messages = [
    { role: 'system', content: isCareer ? buildCareerSystemPrompt(shortName || 'Gyani Sage') : systemPrompt },
  ];
  const tail = Array.isArray(history) ? history.slice(isCareer ? -5 : -10) : [];
  messages.push(...tail);
  messages.push({
    role: 'user',
    content: isCareer ? `Create a detailed career roadmap for: ${question}` : question,
  });
  return { messages, isCareer };
}

// ─── Substitute reasoning fallbacks (ported from openai-reasoning) ───

const SUBSTITUTE_FALLBACK_REASONING =
  'This substitute was selected based on subject expertise match, teaching experience compatibility, ' +
  'and current workload availability. The algorithm determined this to be the optimal choice among available faculty members.';

const SUBSTITUTE_FALLBACK_SHORT =
  'This substitute was selected based on algorithmic analysis of multiple factors including subject expertise, ' +
  'experience, and availability.';

// ─── OpenAI key handling ───

function getOpenAIKey() {
  const key = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!key) {
    throw new Error('AI service is not configured. Set EXPO_PUBLIC_OPENAI_API_KEY and restart the app.');
  }
  return key;
}

module.exports = {
  cleanPhone,
  isValidIndianMobile,
  generateOTP,
  formatWhatsAppReceiver,
  buildSlug,
  parseJsonLoose,
  parseQuiz,
  remainingAttemptsText,
  ACCESS_RANKS,
  hasRequiredAccess,
  canPerformAction,
  getAccessLevelPure,
  DEFAULT_ROLE_ACCESS,
  buildMcqPrompts,
  buildVivaPrompts,
  buildQuestionPaperSystemPrompt,
  buildCareerSystemPrompt,
  buildSageMessages,
  SUBSTITUTE_FALLBACK_REASONING,
  SUBSTITUTE_FALLBACK_SHORT,
  getOpenAIKey,
};
