import { createSelector } from 'reselect';
import { AppState } from '../reducers';
import { Post } from '../models/Post';
import { Feed } from '../models/Feed';

const isPostFromFollowedFeed = (post: Post, followedFeeds: Feed[]): boolean => {
    return followedFeeds.find(feed => {
        return feed != null && post.author != null &&
            feed.feedUrl === post.author.uri;
    }) != null;
};

const isPostFromFavoriteFeed = (post: Post, favoriteFeeds: Feed[]): boolean => {
    return favoriteFeeds.find(feed => {
        return feed != null && post.author != null &&
            feed.feedUrl === post.author.uri;
    }) != null;
};

const getFeeds = (state: AppState) => state.feeds;
const getRssPosts = (state: AppState) => state.rssPosts;

const getSelectedFeedPosts = (state: AppState, feedUrl: string) => {
    return state.rssPosts
        .concat(state.localPosts)
        .filter(post => post != null && post.author != null && post.author.uri === feedUrl);
};

export const getFollowedFeeds = createSelector([ getFeeds ], (feeds) => {
    return feeds.filter(feed => feed.followed === true);
});

export const getFavoriteFeeds = createSelector([ getFeeds ], (feeds) => {
    return feeds.filter(feed => feed.favorite === true);
});

export const getFollowedNewsPosts = createSelector([ getRssPosts, getFollowedFeeds ], (rssPosts, followedFeeds) => {
    return rssPosts.filter(post => isPostFromFollowedFeed(post, followedFeeds));
});

export const getFavoriteFeedsPosts = createSelector([ getRssPosts, getFavoriteFeeds ], (rssPosts, favoriteFeeds) => {
    return rssPosts.filter(post => post != null && isPostFromFavoriteFeed(post, favoriteFeeds));

});

export const getFeedPosts = createSelector([ getSelectedFeedPosts ], (posts) => {
    return posts;
});
