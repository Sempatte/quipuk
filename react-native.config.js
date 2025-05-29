// react-native.config.js
module.exports = {
    project: {
      ios: {},
      android: {},
    },
    dependencies: {
      'react-native-reanimated': {
        platforms: {
          android: {
            sourceDir: '../node_modules/react-native-reanimated/android',
            packageImportPath: 'import io.swmansion.reanimated.ReanimatedPackage;',
          },
          ios: {
            libraryFolder: '../node_modules/react-native-reanimated/ios',
          },
        },
      },
    },
  };