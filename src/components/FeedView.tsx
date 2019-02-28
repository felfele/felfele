import * as React from 'react';
import { RefreshableFeed } from './RefreshableFeed';
import { Feed } from '../models/Feed';
import { Post } from '../models/Post';
import { NavigationHeader } from './NavigationHeader';
import { Colors } from '../styles';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as AreYouSureDialog from './AreYouSureDialog';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';

export interface DispatchProps {
    onRefreshPosts: (feeds: Feed[]) => void;
    onFollowFeed: (feed: Feed) => void;
    onUnfollowFeed: (feed: Feed) => void;
    onToggleFavorite: (feedUrl: string) => void;
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
    return (
        <RefreshableFeed modelHelper={modelHelper} {...props}>
            {{
                navigationHeader: <NavigationHeader
                                      onPressLeftButton={ props.onBack }
                                      rightButtonText2={!props.isOwnFeed ? <Icon
                                          name={isFollowedFeed ? 'link-variant-off' : 'link-variant'}
                                          size={20}
                                          color={Colors.DARK_GRAY}
                                      /> : undefined}
                                      rightButtonText1={!props.isOwnFeed
                                        ? <Icon
                                              name={'star'}
                                              size={20}
                                              color={isFollowedFeed
                                                  ? isFavorite(props.feeds, props.feedUrl) ? Colors.BRAND_PURPLE : Colors.DARK_GRAY
                                                  : 'transparent'
                                              }
                                          />
                                        : <Icon
                                              name={'settings-box'}
                                              size={20}
                                              color={Colors.DARK_GRAY}
                                          />
                                      }
                                      onPressRightButton2={async () => {
                                          return !props.isOwnFeed && await onFollowPressed(props.feedUrl,
                                                                                           props.feeds,
                                                                                           props.onUnfollowFeed,
                                                                                           props.onFollowFeed);
                                      }}
                                      onPressRightButton1={() => {
                                          if (!props.isOwnFeed && isFollowedFeed) {
                                              props.onToggleFavorite(props.feedUrl);
                                          } else {
                                              props.navigation.navigate('FeedSettings', { feed: props.feeds[0] });
                                          }

                                      }}
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
