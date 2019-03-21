import * as React from 'react';
import { RefreshableFeed } from './RefreshableFeed';
import { Feed } from '../models/Feed';
import { Post } from '../models/Post';
import { NavigationHeader, HeaderDefaultLeftButtonIcon } from './NavigationHeader';
import { Colors } from '../styles';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as AreYouSureDialog from './AreYouSureDialog';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';
import { FELFELE_ASSISTANT_NAME } from '../reducers';

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
    navigation: any;
    onBack: () => void;
    feed: ViewFeed;
    posts: Post[];
    gatewayAddress: string;
}

type Props = StateProps & DispatchProps;

export const FeedView = (props: Props) => {
    const modelHelper = new ReactNativeModelHelper(props.gatewayAddress);
    const icon = (name: string, color: string) => <Icon name={name} size={20} color={color} />;
    const button = (iconName: string, color: string, onPress: () => void) => ({
        label: icon(iconName, color),
        onPress,
    });
    const toggleFavorite = () => props.onToggleFavorite(props.feed.feedUrl);
    const navigateToFeedSettings = () => props.navigation.navigate(
        'FeedSettings',
        { feed: props.feed },
    );
    const onLinkPressed = async () => onFollowPressed(props.feed,
        props.onUnfollowFeed,
        props.onFollowFeed
    );
    const rightButton1 = props.feed.isOwnFeed
        ? props.feed.name.length > 0
            ? button('settings-box', Colors.DARK_GRAY, navigateToFeedSettings)
            : undefined
        : props.feed.followed === true
            ? props.feed.favorite === true
                ? button('star', Colors.BRAND_PURPLE, toggleFavorite)
                : button('star', Colors.DARK_GRAY, toggleFavorite)
            : props.feed.name === FELFELE_ASSISTANT_NAME
                ? undefined
                : button('delete', Colors.DARK_GRAY, () => removeFeedAndGoBack(props))
    ;
    const rightButton2 = props.feed.isLocalFeed
        ? undefined
        : props.feed.followed === true
            ? button('link-variant-off', Colors.DARK_GRAY, onLinkPressed)
            : button('link-variant', Colors.DARK_GRAY, onLinkPressed)
    ;
    const refreshableFeedProps = {
        ...props,
        feeds: [props.feed],
    };
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
                    rightButton2={rightButton2}
                    title={props.feed.name}
                />,
            }}
        </RefreshableFeed>
    );
};

const onFollowPressed = async (feed: Feed, onUnfollowFeed: (feed: Feed) => void, onFollowFeed: (feed: Feed) => void) => {
    if (feed.followed === true) {
        await unfollowFeed(feed, onUnfollowFeed);
    } else {
        onFollowFeed(feed);
    }
};

export const unfollowFeed = async (feed: Feed, onUnfollowFeed: (feed: Feed) => void) => {
    const confirmUnfollow = await AreYouSureDialog.show('Are you sure you want to unfollow?');
    if (confirmUnfollow) {
        onUnfollowFeed(feed);
    }
};

const removeFeedAndGoBack = async (props: Props) => {
    const confirmRemove = await AreYouSureDialog.show('Are you sure you want to delete?');
    if (confirmRemove) {
        props.onRemoveFeed(props.feed);
        props.onBack();
    }
};
