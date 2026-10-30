const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const { transformFileSync } = require('@babel/core');
const utils = require('../services/apiUtils');

const compiled = transformFileSync(require.resolve('../services/aiClient.js'), {
  babelrc: false, configFile: false,
  plugins: ['@babel/plugin-transform-modules-commonjs'],
}).code;

function client(fetch) {
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, fetch, AbortController, setTimeout, clearTimeout, SyntaxError,
    require: () => ({ ...utils, getOpenAIKey: () => 'test-key' }),
  });
  return exports;
}

const messages = [{ role: 'user', content: 'Test question' }];

test('shared client preserves model settings and parses fenced JSON', async () => {
  let request;
  const api = client(async (_url, options) => {
    request = JSON.parse(options.body);
    return { ok: true, json: async () => ({ choices: [{ message: { content: '```json\n{"ok":true}\n```' } }] }) };
  });
  assert.deepEqual(await api.chatCompletionJson({ messages, model: 'gpt-4o', maxTokens: 3000 }), { ok: true });
  assert.equal(request.model, 'gpt-4o');
  assert.equal(request.max_tokens, 3000);
  assert.equal(request.response_format.type, 'json_object');
});

test('shared client reports provider failures and empty responses', async () => {
  for (const status of [401, 429, 503]) {
    const api = client(async () => ({ ok: false, status, json: async () => ({ error: { message: 'Provider unavailable' } }) }));
    await assert.rejects(api.chatCompletion({ messages }), e => e.status === status);
  }
  await assert.rejects(client(async () => ({ ok: true, json: async () => ({ choices: [] }) }))
    .chatCompletion({ messages }), /empty response/);
});

test('timeout covers stalled response bodies and aborts the request', async () => {
  const api = client(async (_url, { signal }) => ({
    ok: true,
    json: () => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')))),
  }));
  await assert.rejects(api.chatCompletion({ messages, timeoutMs: 10 }), e => e.status === 408);
});

test('bad JSON is reported without crashing callers', async () => {
  const api = client(async () => ({ ok: true, json: async () => { throw new SyntaxError('bad json'); } }));
  await assert.rejects(api.chatCompletion({ messages }), /invalid response/);
});

const quiz = () => ({
  title: 'Teaching fractions', description: 'Preparation quiz',
  questions: [{ id: 1, question: 'Which method helps?', explanation: 'Visual examples help.',
    correctAnswer: 'A', options: ['A', 'B', 'C', 'D'].map(id => ({ id, text: `Option ${id}` })) }],
});

test('quiz parser accepts valid output and rejects responses that break scoring or rendering', () => {
  assert.equal(utils.parseQuiz(JSON.stringify(quiz()), 1).questions.length, 1);
  const invalid = [null, {}, { ...quiz(), questions: [] }];
  const duplicate = quiz(); duplicate.questions.push({ ...duplicate.questions[0] }); invalid.push(duplicate);
  const wrongAnswer = quiz(); wrongAnswer.questions[0].correctAnswer = 'E'; invalid.push(wrongAnswer);
  const badOption = quiz(); badOption.questions[0].options[0] = null; invalid.push(badOption);
  for (const value of invalid) assert.throws(() => utils.parseQuiz(JSON.stringify(value), 1), /quiz/);
  assert.throws(() => utils.parseQuiz(JSON.stringify(quiz()), 5), /incomplete quiz/);
});
