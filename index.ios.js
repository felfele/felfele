import { AppRegistry } from 'react-native';
import FelfeleApp from './src/App';
import FelfeleShareExtension from './src/share-extension/ShareExtension';

AppRegistry.registerComponent('Felfele', () => FelfeleApp);
AppRegistry.registerComponent('Share', () => FelfeleShareExtension);
