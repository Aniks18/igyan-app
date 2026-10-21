const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const pkg = require('../package.json');

test('daily scripts reuse the dev-client build instead of recompiling native code', () => {
  for (const name of ['dev', 'debug', 'ios', 'android']) {
    const cmd = pkg.scripts[name];
    assert.ok(cmd, `missing script "${name}"`);
    assert.match(cmd, /start --dev-client/, `"${name}" must use the dev client`);
    assert.doesNotMatch(cmd, /run:(ios|android)/, `"${name}" must not trigger a native rebuild`);
  }
});

test('lazy bundling is on for the JS-only loop', () => {
  for (const name of ['start', 'dev', 'debug', 'ios', 'android']) {
    assert.match(pkg.scripts[name] || '', /--lazy/, `"${name}" should bundle lazily`);
  }
});

test('full native rebuilds remain available as explicit escape hatches', () => {
  assert.match(pkg.scripts['ios:native'], /run:ios.*Debug/);
  assert.match(pkg.scripts['android:native'], /run:android.*debug/);
});

test('metro config loads and enables the fast transform/resolver options', () => {
  const config = require('../metro.config');
  assert.equal(config.transformer.hermesParser, true);
  assert.equal(config.resolver.unstable_enablePackageExports, true);
  assert.ok(
    path.resolve(__dirname, '..', 'metro.config.js'),
    'metro.config.js must sit at the project root',
  );
});
