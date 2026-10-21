const { withAppDelegate } = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

// Expo 54's generated delegate predates the scene lifecycle required by iOS 27.
module.exports = function withIOSScenes(config) {
  return withAppDelegate(config, (config) => {
    if (config.modResults.language !== 'swift') {
      throw new Error('The iOS scene delegate requires a Swift AppDelegate.');
    }
    config.modResults.contents = fs.readFileSync(
      path.join(__dirname, 'ios/AppDelegate.swift'), 'utf8'
    );
    return config;
  });
};
