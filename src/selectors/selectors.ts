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
const getOwnFeeds = (state: AppState) => state.ownFeeds;

const getRssPosts = (state: AppState) => state.rssPosts;
const getOwnPosts = (state: AppState) => state.localPosts;

const getSelectedFeedPosts = (state: AppState, feedUrl: string) => {
    return state.rssPosts
        .concat(state.localPosts)
        .filter(post => {
            // TODO: author / profile / associated feed cleanup
            return post != null && post.author != null && (post.author.uri === feedUrl || post.author.name === state.author.name);
        });
};

export const getFollowedFeeds = createSelector([ getFeeds ], (feeds) => {
    return feeds.filter(feed => feed.followed === true);
});

export const getKnownFeeds = createSelector([ getFeeds ], (feeds) => {
    return feeds.filter(feed => feed.followed !== true);
});

export const getFavoriteFeeds = createSelector([ getFeeds ], (feeds) => {
    return feeds.filter(feed => feed.favorite === true);
});

export const getAllFeeds = createSelector([ getFeeds, getOwnFeeds ], (feeds, ownFeeds) => {
    return feeds.concat(ownFeeds);
});

export const getFollowedNewsPosts = createSelector([ getRssPosts, getFollowedFeeds ], (rssPosts, followedFeeds) => {
    return rssPosts.filter(post => isPostFromFollowedFeed(post, followedFeeds));
});

export const getAllPostsSorted = createSelector([ getFollowedNewsPosts, getOwnPosts ], (followedNewsPosts, ownPosts) => {
    return followedNewsPosts.concat(ownPosts).sort((a, b) => b.createdAt - a.createdAt);
});

export const getFavoriteFeedsPosts = createSelector([ getRssPosts, getFavoriteFeeds ], (rssPosts, favoriteFeeds) => {
    return rssPosts.filter(post => post != null && isPostFromFavoriteFeed(post, favoriteFeeds));

});

export const getFeedPosts = createSelector([ getSelectedFeedPosts ], (posts) => {
    return posts;
});
