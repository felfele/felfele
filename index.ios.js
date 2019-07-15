import { AppRegistry } from 'react-native';
import App from './src/App';
import FelfeleShareExtension from './src/share-extension/ShareExtension';

AppRegistry.registerComponent('Felfele', () => App);
AppRegistry.registerComponent('Share', () => FelfeleShareExtension);
