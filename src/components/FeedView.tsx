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

export interface StateProps {
    navigation: any;
    onBack: () => void;
    feedUrl: string;
    feedName: string;
    posts: Post[];
    feeds: Feed[];
    isOwnFeed: boolean;
    gatewayAddress: string;
}

type Props = StateProps & DispatchProps;

export const FeedView = (props: Props) => {
    const isFollowedFeed = props.feeds.find(feed => feed.feedUrl === props.feedUrl && feed.followed === true) != null;
    const modelHelper = new ReactNativeModelHelper(props.gatewayAddress);
    const isLocalFeed = props.isOwnFeed || props.feeds.length === 0;
    const icon = (name: string, color: string) => <Icon name={name} size={20} color={color} />;
    const button = (iconName: string, color: string, onPress: () => void) => ({
        label: icon(iconName, color),
        onPress,
    });
    const toggleFavorite = () => props.onToggleFavorite(props.feedUrl);
    const navigateToFeedSettings = () => props.navigation.navigate(
        'FeedSettings',
        { feed: props.feeds[0] },
    );
    const onLinkPressed = async () => onFollowPressed(props.feedUrl,
        props.feeds,
        props.onUnfollowFeed,
        props.onFollowFeed
    );
    const rightButton1 = props.isOwnFeed
        ? props.feedName.length > 0
            ? button('settings-box', Colors.DARK_GRAY, navigateToFeedSettings)
            : undefined
        : isFollowedFeed
            ? isFavorite(props.feeds, props.feedUrl)
                ? button('star', Colors.BRAND_PURPLE, toggleFavorite)
                : button('star', Colors.DARK_GRAY, toggleFavorite)
            : props.feedName === FELFELE_ASSISTANT_NAME
                ? undefined
                : button('delete', Colors.DARK_GRAY, () => removeFeedAndGoBack(props))
    ;
    const rightButton2 = isLocalFeed
        ? undefined
        : isFollowedFeed
            ? button('link-variant-off', Colors.DARK_GRAY, onLinkPressed)
            : button('link-variant', Colors.DARK_GRAY, onLinkPressed)
    ;
    return (
        <RefreshableFeed modelHelper={modelHelper} {...props}>
            {{
                navigationHeader: <NavigationHeader
                    navigation={props.navigation}
                    leftButton={{
                        onPress: props.onBack,
                        label: HeaderDefaultLeftButtonIcon,
                    }}
                    rightButton1={rightButton1}
                    rightButton2={rightButton2}
                    title={props.feedName}
                />,
            }}
        </RefreshableFeed>
    );
};

const isFavorite = (feeds: Feed[], uri: string): boolean => {
    const feed = feeds.find(value => value.feedUrl === uri);
    return feed != null && !!feed.favorite;
};

const onFollowPressed = async (uri: string, feeds: Feed[], onUnfollowFeed: (feed: Feed) => void, onFollowFeed: (feed: Feed) => void) => {
    const followedFeed = feeds.find(feed => feed.feedUrl === uri && feed.followed === true);
    if (followedFeed != null) {
        await unfollowFeed(followedFeed, onUnfollowFeed);
    } else {
        followFeed(uri, feeds, onFollowFeed);
    }
};

export const unfollowFeed = async (feed: Feed, onUnfollowFeed: (feed: Feed) => void) => {
    const confirmUnfollow = await AreYouSureDialog.show('Are you sure you want to unfollow?');
    if (confirmUnfollow) {
        onUnfollowFeed(feed);
    }
};

const followFeed = (uri: string, feeds: Feed[], onFollowFeed: (feed: Feed) => void) => {
    const knownFeed = feeds.find(feed => feed.feedUrl === uri && feed.followed !== true);
    if (knownFeed != null) {
        onFollowFeed(knownFeed);
    }
};

const removeFeedAndGoBack = async (props: Props) => {
    const confirmRemove = await AreYouSureDialog.show('Are you sure you want to delete?');
    const feedToRemove = props.feeds.find(feed => feed.feedUrl === props.feedUrl && feed.followed !== true);
    if (feedToRemove != null && confirmRemove) {
        props.onRemoveFeed(feedToRemove);
        props.onBack();
    }
};
