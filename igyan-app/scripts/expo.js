const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const cliRoot = path.dirname(require.resolve('@expo/cli/package.json', {
  paths: [require.resolve('expo/package.json')],
}));

function configureDeviceHub() {
  if (process.platform !== 'darwin') return false;
  let developer;
  try {
    developer = execFileSync('xcode-select', ['-p'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return false;
  }
  const hub = path.resolve(developer, '../Applications/DeviceHub.app');
  if (fs.existsSync(path.join(developer, 'Applications/Simulator.app')) || !fs.existsSync(hub)) return false;

  // shortcut: Expo 54 expects Simulator.app; remove when Expo supports Device Hub.
  const { SimulatorAppPrerequisite } = require(path.join(cliRoot, 'build/src/start/doctor/apple/SimulatorAppPrerequisite'));
  SimulatorAppPrerequisite.instance.assertAsync = async () => {
    execFileSync('xcrun', ['simctl', 'help'], { stdio: 'ignore' });
  };
  const { AppleDeviceManager } = require(path.join(cliRoot, 'build/src/start/platforms/ios/AppleDeviceManager'));
  AppleDeviceManager.prototype.activateWindowAsync = async function () {
    execFileSync('open', ['-a', hub]);
  };
  return true;
}

if (require.main === module) {
  configureDeviceHub();
  require(cliRoot);
}

module.exports = { configureDeviceHub };
