const nodelibs = require('node-libs-react-native');
nodelibs.vm  = require.resolve('vm-browserify');
nodelibs.stream = require.resolve('stream-browserify');

module.exports = {
  getTransformModulePath() {
    return require.resolve('react-native-typescript-transformer')
  },
  getSourceExts() {
    return ['ts', 'tsx'];
  },
  extraNodeModules: nodelibs
}
