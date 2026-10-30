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

test('development scripts use flags supported by the installed Expo CLI', () => {
  const { execFileSync } = require('node:child_process');
  const help = execFileSync(process.execPath, [path.join(__dirname, 'expo.js'), 'start', '--help'], { encoding: 'utf8' });
  for (const name of ['start', 'dev', 'debug', 'ios', 'android']) {
    for (const flag of pkg.scripts[name].match(/--[\w-]+/g) || []) {
      assert.ok(help.includes(flag), `"${name}" uses unsupported flag ${flag}`);
    }
  }
});

test('the Babel async runtime helper is available to app code', () => {
  assert.ok(pkg.dependencies['@babel/runtime']);
  assert.equal(typeof require('@babel/runtime/helpers/asyncToGenerator'), 'function');
});

test('development client dependency matches the installed Expo SDK', () => {
  assert.equal(pkg.dependencies['expo-dev-client'], require('expo/bundledNativeModules.json')['expo-dev-client']);
  assert.ok(require.resolve('expo-dev-client/package.json'));
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
