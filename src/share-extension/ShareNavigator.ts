import { createStackNavigator, createSwitchNavigator } from 'react-navigation';
import { ShareWithContainer } from '../ui/screens/share-with/ShareWithContainer';
import { SharePostEditorContainer } from './SharePostEditorContainer';

export const ShareNavigator = createSwitchNavigator({
    Post: SharePostEditorContainer,
    ShareWith: ShareWithContainer,
}, {
    initialRouteName: 'Post',
    backBehavior: 'initialRoute',
});
