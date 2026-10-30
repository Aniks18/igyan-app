const { withAppDelegate, withPodfile } = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

const deploymentTargetPatch = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_configuration|
        build_configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
      end
    end`;

function withMinimumPodDeploymentTarget(config) {
  return withPodfile(config, (config) => {
    if (!config.modResults.contents.includes("build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'")) {
      config.modResults.contents = config.modResults.contents.replace(
        '  end\nend\n',
        `${deploymentTargetPatch}\n  end\nend\n`
      );
    }
    return config;
  });
}

// Expo 54's generated delegate predates the scene lifecycle required by iOS 27.
module.exports = function withIOSScenes(config) {
  config = withAppDelegate(config, (config) => {
    if (config.modResults.language !== 'swift') {
      throw new Error('The iOS scene delegate requires a Swift AppDelegate.');
    }
    config.modResults.contents = fs.readFileSync(
      path.join(__dirname, 'ios/AppDelegate.swift'), 'utf8'
    );
    return config;
  });
  return withMinimumPodDeploymentTarget(config);
};

module.exports.withMinimumPodDeploymentTarget = withMinimumPodDeploymentTarget;
