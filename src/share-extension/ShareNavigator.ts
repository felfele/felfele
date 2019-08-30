import { createStackNavigator } from 'react-navigation';
import { ShareWithContainer } from '../ui/screens/share-with/ShareWithContainer';
import { SharePostEditorContainer } from './SharePostEditorContainer';

export const ShareNavigator = createStackNavigator({
    SharePostEditorContainer: SharePostEditorContainer,
    ShareWithContainer: ShareWithContainer,
}, {
    initialRouteName: 'Post',
    navigationOptions: {
        header: null,
    },
});
