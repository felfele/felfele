import * as React from 'react';
import { RefreshableFeed } from './RefreshableFeed';
import { Feed } from '../models/Feed';
import { Post } from '../models/Post';
import { NavigationHeader } from './NavigationHeader';
import { Colors } from '../styles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';
import { PlaceholderCard } from '../ui/misc/PlaceholderCard';
import SvgUri from 'react-native-svg-uri';

export interface DispatchProps {
    onRefreshPosts: (feeds: Feed[]) => void;
}

export interface StateProps {
    navigation: any;
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
                navigationHeader: <NavigationHeader
                                      title='Favorites'
                                      rightButtonText1={
                                          <Icon
                                              name={'view-grid'}
                                              size={20}
                                              color={Colors.DARK_GRAY}
                                          />
                                      }
                                      onPressRightButton1={() => props.navigation.navigate('FeedListViewerContainer', { feeds: props.feeds })}
                                  />,
                placeholder: <PlaceholderCard
                                 boldText={PLACEHOLDER_TEXT_1}
                                 regularText={PLACEHOLDER_TEXT_2}
                                 image={<SvgUri
                                            width='29'
                                            height='29'
                                            fill={Colors.BRAND_PURPLE}
                                            source={require('../../images/scuba.svg')}
                                />}
                             />,
            }}
        </RefreshableFeed>
    );
};
