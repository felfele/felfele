import * as React from 'react';
import { RefreshableFeed } from './RefreshableFeed';
import { Feed } from '../models/Feed';
import { Post } from '../models/Post';
import { NavigationHeader } from './NavigationHeader';
import { Colors, ComponentColors } from '../styles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';
import { PlaceholderCard } from '../ui/misc/PlaceholderCard';

// @ts-ignore
import SnorkelingIcon from '../../images/snorkeling.svg';
import { TypedNavigation } from '../helpers/navigation';

export interface DispatchProps {
    onRefreshPosts: (feeds: Feed[]) => void;
}

export interface StateProps {
    navigation: TypedNavigation;
    posts: Post[];
    feeds: Feed[];
    gatewayAddress: string;
}

type Props = StateProps & DispatchProps;

const PLACEHOLDER_TEXT_1 = "You don't have favorite channels.";
const PLACEHOLDER_TEXT_2 = 'Go to a channel and simply tap the star icon on the top-right corner to add it here.';

export const FavoritesFeedView = (props: Props) => {
    const modelHelper = new ReactNativeModelHelper(props.gatewayAddress);
    return (
        <RefreshableFeed modelHelper={modelHelper} {...props}>
            {{
                navigationHeader:
                    <NavigationHeader
                        title='Favorites'
                        leftButton={{
                            onPress: () => props.navigation.navigate(
                                'FavoriteListViewerContainer', {
                                    feeds: props.feeds,
                                }
                            ),
                            label: <Icon
                                name={'apps'}
                                size={24}
                                color={ComponentColors.NAVIGATION_BUTTON_COLOR}
                            />,
                        }}
                    />,
                placeholder: <PlaceholderCard
                                 boldText={PLACEHOLDER_TEXT_1}
                                 regularText={PLACEHOLDER_TEXT_2}
                                 image={<Icon
                                            name='star-outline'
                                            size={48}
                                            color={Colors.BLACK}
                                />}
                             />,
            }}
        </RefreshableFeed>
    );
};
