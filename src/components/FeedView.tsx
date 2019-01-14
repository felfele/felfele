import * as React from 'react';
import { RefreshableFeed } from './RefreshableFeed';
import { Feed } from '../models/Feed';
import { Post } from '../models/Post';
import { Settings } from '../models/Settings';
import { NavigationHeader } from './NavigationHeader';
import { Colors } from '../styles';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import * as AreYouSureDialog from './AreYouSureDialog';

export interface DispatchProps {
    onRefreshPosts: (feeds: Feed[]) => void;
    onFollowFeed: (feed: Feed) => void;
    onUnfollowFeed: (feed: Feed) => void;
    onToggleFavorite: (feedUrl: string) => void;
}

export interface StateProps {
    navigation: any;
    uri: string;
    name: string;
    posts: Post[];
    feeds: Feed[];
    settings: Settings;
    isOwnFeed: boolean;
}

type Props = StateProps & DispatchProps;

export const FeedView = (props: Props) => {
    const isFollowedFeed = props.feeds.find(feed => feed.feedUrl === props.uri && feed.followed === true) != null;
    return (
        <RefreshableFeed {...props}>
            {{
                navigationHeader: <NavigationHeader
                                      onPressLeftButton={() => props.navigation.goBack(null)}
                                      rightButtonText1={!props.isOwnFeed ? <Icon
                                          name={isFollowedFeed ? 'link-variant-off' : 'link-variant'}
                                          size={20}
                                          color={Colors.DARK_GRAY}
                                      /> : undefined}
                                      rightButtonText2={!props.isOwnFeed ? <MaterialIcon
                                          name={'favorite'}
                                          size={20}
                                          color={isFollowedFeed
                                              ? isFavorite(props.feeds, props.uri) ? Colors.BRAND_RED : Colors.DARK_GRAY
                                              : 'transparent'
                                          }
                                      /> : undefined}
                                      onPressRightButton1={async () => {
                                          return !props.isOwnFeed && await onFollowPressed(props.uri,
                                                                                           props.feeds,
                                                                                           props.onUnfollowFeed,
                                                                                           props.onFollowFeed);
                                      }}
                                      onPressRightButton2={() => !props.isOwnFeed && isFollowedFeed && props.onToggleFavorite(props.uri)}
                                      title={props.name}
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

const unfollowFeed = async (feed: Feed, onUnfollowFeed: (feed: Feed) => void) => {
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

export const MemoizedFeedView = React.memo(FeedView);
