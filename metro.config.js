const path = require('path');

const { getDefaultConfig } = require("metro-config");

const extraNodeModules = {
  '@erebos/api-bzz-browser': path.resolve(__dirname + '/../../../3rdparty/erebos/packages/api-bzz-browser/'),
};
const watchFolders = [
  path.resolve(__dirname + '/../../../3rdparty/erebos/packages/api-bzz-browser/')
];

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts }
  } = await getDefaultConfig();
  return {
    transformer: {
      babelTransformerPath: require.resolve("react-native-svg-transformer")
    },
    resolver: {
      assetExts: assetExts.filter(ext => ext !== "svg"),
      sourceExts: [...sourceExts, "svg"],
      extraNodeModules
    },
    watchFolders
  };
})();
