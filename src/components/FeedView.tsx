import * as React from 'react';
import { RefreshableFeed } from './RefreshableFeed';
import { Feed } from '../models/Feed';
import { Post } from '../models/Post';
import { NavigationHeader, HeaderDefaultLeftButtonIcon } from './NavigationHeader';
import { Colors } from '../styles';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as AreYouSureDialog from './AreYouSureDialog';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';
import { FELFELE_ASSISTANT_URL } from '../reducers/defaultData';
import { TypedNavigation, Routes } from '../helpers/navigation';
import { LocalFeed } from '../social/api';

export interface DispatchProps {
    onRefreshPosts: (feeds: Feed[]) => void;
    onFollowFeed: (feed: Feed) => void;
    onUnfollowFeed: (feed: Feed) => void;
    onToggleFavorite: (feedUrl: string) => void;
    onRemoveFeed: (feed: Feed) => void;
}

export interface StateProps {
    navigation: TypedNavigation;
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
    const isOnboardingFeed = props.feeds[0] != null && props.feeds[0].feedUrl === FELFELE_ASSISTANT_URL;
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
        { feed: props.feeds[0] as LocalFeed },
    );
    const navigateToFeedInfo = () => props.navigation.navigate(
        'FeedInfo', {
            feed: props.feeds[0],
        }
    );
    const onLinkPressed = async () => onFollowPressed(props.feedUrl,
        props.feeds,
        props.onUnfollowFeed,
        props.onFollowFeed
    );

    const rightButton1 = props.isOwnFeed
        ? props.feedName.length > 0
            ? button('dots-vertical', Colors.DARK_GRAY, navigateToFeedSettings)
            : undefined
        : isOnboardingFeed
            ? undefined
            : isFollowedFeed
                ? isFavorite(props.feeds, props.feedUrl)
                    ? button('star', Colors.BRAND_PURPLE, toggleFavorite)
                    : button('star', Colors.DARK_GRAY, toggleFavorite)
                : button('link-variant', Colors.DARK_GRAY, onLinkPressed)
    ;

    const rightButton2 = isLocalFeed || isOnboardingFeed
        ? undefined
        : button('dots-vertical', Colors.DARK_GRAY, navigateToFeedInfo)
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
