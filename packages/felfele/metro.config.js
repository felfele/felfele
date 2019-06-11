const { getDefaultConfig } = require("metro-config");
const fs = require('fs');
const getDevPaths = require('get-dev-paths');

const projectRoot = __dirname;
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
      sourceExts: [...sourceExts, "svg"]
    },
    // fix from https://github.com/facebook/metro/issues/1
    getProjectRoots: () => Array.from(new Set(
      getDevPaths(projectRoot).map($ => fs.realpathSync($))
    )),
    watchFolders: Array.from(new Set(
      getDevPaths(projectRoot).map($ => fs.realpathSync($))
    )),
  };
})();
