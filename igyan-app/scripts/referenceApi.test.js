const assert = require('node:assert/strict');
const test = require('node:test');

const apiUtils = require('../services/apiUtils');

test('cleanPhone normalizes Indian mobile numbers', () => {
  assert.equal(apiUtils.cleanPhone('+91 98765 43210'), '9876543210');
  assert.equal(apiUtils.cleanPhone('919876543210'), '9876543210');
  assert.equal(apiUtils.cleanPhone('9876543210'), '9876543210');
  assert.equal(apiUtils.cleanPhone(' 09876543210 '), '09876543210');
});

test('isValidIndianMobile accepts only 10-digit numbers', () => {
  assert.equal(apiUtils.isValidIndianMobile('9876543210'), true);
  assert.equal(apiUtils.isValidIndianMobile('+919876543210'), true);
  assert.equal(apiUtils.isValidIndianMobile('12345'), false);
  assert.equal(apiUtils.isValidIndianMobile(''), false);
});

test('generateOTP produces a 6-digit code', () => {
  for (let i = 0; i < 25; i += 1) {
    assert.match(apiUtils.generateOTP(), /^\d{6}$/);
  }
});

test('formatWhatsAppReceiver prefixes the country code', () => {
  assert.equal(apiUtils.formatWhatsAppReceiver('9876543210'), '919876543210');
});

test('buildSlug matches the reference blog slug rules', () => {
  assert.equal(apiUtils.buildSlug('Hello World! 101'), 'hello-world-101');
  assert.equal(apiUtils.buildSlug('  --AI & ML-- '), 'ai-ml');
  assert.equal(apiUtils.buildSlug(''), '');
});

test('parseJsonLoose strips markdown fences before parsing', () => {
  assert.deepEqual(apiUtils.parseJsonLoose('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(apiUtils.parseJsonLoose('```\n[1,2]\n```'), [1, 2]);
  assert.deepEqual(apiUtils.parseJsonLoose('{"a":1}'), { a: 1 });
  assert.throws(() => apiUtils.parseJsonLoose('not json'), SyntaxError);
});

test('remainingAttemptsText counts down from max attempts', () => {
  assert.equal(
    apiUtils.remainingAttemptsText({ attempts: 1, max_attempts: 5 }),
    'Incorrect OTP. 3 attempt(s) remaining.',
  );
});

test('hasRequiredAccess follows the view < edit < delete < all hierarchy', () => {
  assert.equal(apiUtils.hasRequiredAccess('all', 'delete'), true);
  assert.equal(apiUtils.hasRequiredAccess('view', 'view'), true);
  assert.equal(apiUtils.hasRequiredAccess('view', 'edit'), false);
  assert.equal(apiUtils.hasRequiredAccess('edit', 'delete'), false);
  assert.equal(apiUtils.hasRequiredAccess('delete', 'delete'), true);
  assert.equal(apiUtils.hasRequiredAccess('none', 'view'), false);
  assert.equal(apiUtils.hasRequiredAccess(undefined, 'view'), false);
});

test('canPerformAction matches the reference action matrix', () => {
  assert.equal(apiUtils.canPerformAction('edit', 'view'), true);
  assert.equal(apiUtils.canPerformAction('view', 'edit'), false);
  assert.equal(apiUtils.canPerformAction('delete', 'delete'), true);
  assert.equal(apiUtils.canPerformAction('delete', 'view'), true);
  assert.equal(apiUtils.canPerformAction('view', 'archive'), false);
  assert.equal(apiUtils.canPerformAction('all', 'delete'), true);
});

test('getAccessLevelPure resolves super_admin, hits, and misses', () => {
  assert.equal(apiUtils.getAccessLevelPure(null, 'Dashboard', {}), 'none');
  assert.equal(apiUtils.getAccessLevelPure({ role: 'super_admin' }, 'Dashboard', {}), 'all');
  assert.equal(apiUtils.getAccessLevelPure({ role: 'student' }, 'Messages', { Messages: 'all' }), 'all');
  assert.equal(apiUtils.getAccessLevelPure({ role: 'student' }, 'Settings', {}), 'none');
});

test('DEFAULT_ROLE_ACCESS carries the reference module grants', () => {
  assert.equal(apiUtils.DEFAULT_ROLE_ACCESS.student.length, 9);
  assert.equal(apiUtils.DEFAULT_ROLE_ACCESS.faculty.length, 12);
  assert.equal(apiUtils.DEFAULT_ROLE_ACCESS.co_admin.length, 14);
  assert.ok(
    apiUtils.DEFAULT_ROLE_ACCESS.student.some((g) => g.module === 'Viva AI' && g.access === 'all'),
  );
});

test('buildMcqPrompts encodes class, subject, and strict JSON format', () => {
  const { systemPrompt, userPrompt } = apiUtils.buildMcqPrompts({
    topic: 'Photosynthesis',
    numQuestions: 5,
    subject: 'Science',
    classLevel: '10',
    difficulty: 'medium',
    language: 'English',
    bloomsLevel: 'understanding',
  });
  assert.match(systemPrompt, /Class 10/);
  assert.match(userPrompt, /Science/);
  assert.match(userPrompt, /Photosynthesis/);
  assert.match(userPrompt, /correct_answer/);
  assert.match(userPrompt, /NO markdown/);
});

test('buildVivaPrompts requests open-ended questions with answers', () => {
  const { userPrompt } = apiUtils.buildVivaPrompts({
    topic: 'Gravity',
    numQuestions: 3,
    subject: 'Physics',
    classLevel: '9',
  });
  assert.match(userPrompt, /suggested_answer/);
  assert.match(userPrompt, /Class 9/);
});

test('buildSageMessages caps career history at 5 and chat history at 10', () => {
  const history = Array.from({ length: 8 }, (_, i) => ({ role: 'user', content: `q${i}` }));
  const career = apiUtils.buildSageMessages({ mode: 'career', shortName: 'Sage', question: 'roadmap', history });
  assert.equal(career.isCareer, true);
  assert.equal(career.messages.length, 7);
  assert.match(career.messages[0].content, /Sage/);
  assert.match(career.messages[career.messages.length - 1].content, /roadmap/);

  const chat = apiUtils.buildSageMessages({ mode: 'chat', question: 'hi', history, systemPrompt: 'sys' });
  assert.equal(chat.isCareer, false);
  assert.equal(chat.messages[0].content, 'sys');
  assert.equal(chat.messages.length, 10);
});

test('getOpenAIKey returns the env key or throws the configured-service error', () => {
  const previous = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  try {
    process.env.EXPO_PUBLIC_OPENAI_API_KEY = 'sk-test';
    assert.equal(apiUtils.getOpenAIKey(), 'sk-test');
    delete process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    assert.throws(() => apiUtils.getOpenAIKey(), /AI service is not configured/);
  } finally {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    else process.env.EXPO_PUBLIC_OPENAI_API_KEY = previous;
  }
});
