const assert = require('node:assert/strict');
const test = require('node:test');
const withIOSScenes = require('./with-ios-scenes');
const app = require('../app.json').expo;

test('prebuild installs the scene delegate registered in app config', async () => {
  const config = withIOSScenes({});
  const result = await config.mods.ios.appDelegate({
    modRequest: {},
    modResults: { language: 'swift', contents: '// generated delegate' },
  });
  const scene = app.ios.infoPlist.UIApplicationSceneManifest;
  assert.equal(scene.UIApplicationSupportsMultipleScenes, false);
  const name = scene.UISceneConfigurations.UIWindowSceneSessionRoleApplication[0]
    .UISceneDelegateClassName.split('.').pop();
  assert.ok(result.modResults.contents.includes(`class ${name}: UIResponder, UIWindowSceneDelegate`));
  assert.ok(result.modResults.contents.includes('UIWindow(windowScene: windowScene)'));
  assert.ok(!result.modResults.contents.includes('UIWindow(frame: UIScreen.main.bounds)'));
});

test('prebuild refuses to overwrite an Objective-C delegate with Swift', async () => {
  const config = withIOSScenes({});
  await assert.rejects(config.mods.ios.appDelegate({
    modRequest: {},
    modResults: { language: 'objc', contents: '' },
  }), /requires a Swift AppDelegate/);
});
