import { createSelector } from 'reselect';
import { AppState } from '../reducers/AppState';
import { Post } from '../models/Post';
import { Feed } from '../models/Feed';
import { MutualContact } from '../models/Contact';
import { makeBzzFeedUrlFromIdentity } from '../helpers/feedHelpers';
import { ContactFeed } from '../models/ContactFeed';

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
const getLocalPosts = (state: AppState) => state.localPosts;
const getProfile = (state: AppState) => state.author;
const getContacts = (state: AppState) => state.contacts;

const getSelectedFeedPosts = (state: AppState, feedUrl: string) => {
    return state.rssPosts
        .filter(post => {
            return post != null && post.author != null && post.author.uri === feedUrl;
        });
};

export const getContactFeeds = createSelector([ getContacts ], (contacts) => {
    const mutualContacts = contacts.filter(contact => contact.type === 'mutual-contact') as MutualContact[];
    return mutualContacts.map(contact => ({
        name: contact.name,
        url: makeBzzFeedUrlFromIdentity(contact.identity),
        feedUrl: makeBzzFeedUrlFromIdentity(contact.identity),
        favicon: '',
        followed: true,
        contact,
    } as ContactFeed));
});

export const getFollowedFeeds = createSelector([ getFeeds, getContactFeeds ], (feeds, contactFeeds) => {
    return feeds.concat(contactFeeds).filter(feed => feed.followed === true);
});

export const getKnownFeeds = createSelector([ getFeeds ], (feeds) => {
    return feeds.filter(feed => feed.followed !== true);
});

export const getFavoriteFeeds = createSelector([ getFeeds ], (feeds) => {
    return feeds.filter(feed => feed.favorite === true);
});

export const getAllFeeds = createSelector([ getFeeds, getOwnFeeds, getContactFeeds ], (feeds, ownFeeds, contactFeeds) => {
    return feeds.concat(ownFeeds).concat(contactFeeds);
});

export const getFollowedNewsPosts = createSelector([ getRssPosts, getFollowedFeeds ], (rssPosts, followedFeeds) => {
    return rssPosts.filter(post => isPostFromFollowedFeed(post, followedFeeds));
});

const postUpdateTime = (post: Post): number => {
    return post.updatedAt != null
        ? post.updatedAt
        : post.createdAt
        ;
};

const postTimeCompare = (a: Post, b: Post): number => {
    const aUpdateTime = postUpdateTime(a);
    const bUpdateTime = postUpdateTime(b);
    return bUpdateTime - aUpdateTime;
};

export const getAllPostsSorted = createSelector([ getFollowedNewsPosts, getLocalPosts ], (followedNewsPosts, ownPosts) => {
    return followedNewsPosts.concat(ownPosts).sort(postTimeCompare);
});

export const getFavoriteFeedsPosts = createSelector([ getRssPosts, getFavoriteFeeds ], (rssPosts, favoriteFeeds) => {
    return rssPosts.filter(post => post != null && isPostFromFavoriteFeed(post, favoriteFeeds));

});

export const getFeedPosts = createSelector([ getSelectedFeedPosts ], (posts) => {
    return posts;
});

export const getYourPosts = createSelector([ getLocalPosts, getProfile ], (posts, author) => {
    // TODO cleanup author
    return posts.filter(post => post.author && post.author.name === author.name);
});
