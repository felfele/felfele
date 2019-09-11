import * as React from 'react';
import { RefreshableFeed } from './RefreshableFeed';
import { Feed } from '../models/Feed';
import { Post } from '../models/Post';
import { NavigationHeader, HeaderDefaultLeftButtonIcon } from './NavigationHeader';
import { ComponentColors } from '../styles';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as AreYouSureDialog from './AreYouSureDialog';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';
import { FELFELE_ASSISTANT_URL } from '../reducers/defaultData';
import { TypedNavigation } from '../helpers/navigation';
import { LocalFeed } from '../social/api';
import { isFelfeleResource } from '../helpers/urlUtils';
import { WideButton } from '../ui/buttons/WideButton';

export interface DispatchProps {
    onRefreshPosts: (feeds: Feed[]) => void;
    onFollowFeed: (feed: Feed) => void;
    onUnfollowFeed: (feed: Feed) => void;
    onToggleFavorite: (feedUrl: string) => void;
    onRemoveFeed: (feed: Feed) => void;
}

export interface ViewFeed extends Feed {
    isOwnFeed: boolean;
    isLocalFeed: boolean;
}

export interface StateProps {
    navigation: TypedNavigation;
    onBack: () => void;
    feed: ViewFeed;
    posts: Post[];
    gatewayAddress: string;
}

type Props = StateProps & DispatchProps;

export const FeedView = (props: Props) => {
    const isOnboardingFeed = props.feed.feedUrl === FELFELE_ASSISTANT_URL;

    const modelHelper = new ReactNativeModelHelper(props.gatewayAddress);
    const icon = (name: string, color: string) => <Icon name={name} size={20} color={color} />;
    const button = (iconName: string, color: string, onPress: () => void) => ({
        label: icon(iconName, color),
        onPress,
    });
    const isUrlFelfeleResource = isFelfeleResource(props.feed.feedUrl);
    const navigateToFeedInfo = () => props.navigation.navigate(
        isUrlFelfeleResource ? 'FeedInfo' : 'RSSFeedInfo', {
            feed: props.feed,
        }
    );
    const rightButton1 = props.feed.isLocalFeed || isOnboardingFeed
        ? undefined
        : button('information', ComponentColors.NAVIGATION_BUTTON_COLOR, navigateToFeedInfo)
    ;
    const refreshableFeedProps = {
        ...props,
        feeds: [props.feed],
    };
    const listHeader = props.feed.isLocalFeed || isOnboardingFeed
        ? undefined
        : props.feed.followed !== true
            ? <WideButton
                label='Follow this channel'
                icon={icon('link', ComponentColors.BUTTON_COLOR)}
                onPress={() => props.onFollowFeed(props.feed)}
            />
            : undefined
    ;
    return (
        <RefreshableFeed modelHelper={modelHelper} {...refreshableFeedProps}>
            {{
                navigationHeader: <NavigationHeader
                    navigation={props.navigation}
                    leftButton={{
                        onPress: props.onBack,
                        label: HeaderDefaultLeftButtonIcon,
                    }}
                    rightButton1={rightButton1}
                    title={props.feed.name}
                />,
                listHeader,
            }}
        </RefreshableFeed>
    );
};

export const unfollowFeed = async (feed: Feed, onUnfollowFeed: (feed: Feed) => void) => {
    const confirmUnfollow = await AreYouSureDialog.show('Are you sure you want to unfollow?');
    if (confirmUnfollow) {
        onUnfollowFeed(feed);
    }
};
