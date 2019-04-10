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
import { TypedNavigation, Routes } from '../helpers/navigation';

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

const PLACEHOLDER_TEXT_1 = "You don't have any favorite feed yet.";
const PLACEHOLDER_TEXT_2 = 'Go to any feed and simply tap the star icon to add it to your favorites.';

export const FavoritesFeedView = (props: Props) => {
    const modelHelper = new ReactNativeModelHelper(props.gatewayAddress);
    return (
        <RefreshableFeed modelHelper={modelHelper} {...props}>
            {{
                navigationHeader:
                    <NavigationHeader
                        title='Favorites'
                        rightButton1={{
                            onPress: () => props.navigation.navigate(
                                'FavoriteListViewerContainer', {
                                    feeds: props.feeds,
                                }
                            ),
                            label: <Icon
                                name={'view-grid'}
                                size={20}
                                color={ComponentColors.NAVIGATION_BUTTON_COLOR}
                            />,
                        }}
                    />,
                placeholder: <PlaceholderCard
                                 boldText={PLACEHOLDER_TEXT_1}
                                 regularText={PLACEHOLDER_TEXT_2}
                                 image={<SnorkelingIcon
                                            width={29}
                                            height={29}
                                            fill={Colors.BRAND_PURPLE}
                                />}
                             />,
            }}
        </RefreshableFeed>
    );
};
