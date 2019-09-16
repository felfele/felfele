import { ActionsUnion } from './types';
import { ActionTypes } from './ActionTypes';
import { createAction } from './actionHelpers';
import { Feed } from '../models/Feed';
import { ContentFilter } from '../models/ContentFilter';
import { AppState } from '../reducers/AppState';
import { RSSPostManager } from '../RSSPostManager';
import { Post, PrivatePost } from '../models/Post';
import { ImageData } from '../models/ImageData';
import {
    LocalFeed,
    RecentPostFeed,
} from '../social/api';
import { PrivateIdentity } from '../models/Identity';
import { ContactActions } from './ContactActions';
import { HexString } from '../helpers/opaqueTypes';
import { PrivatePostActions } from './PrivatePostActions';

export type Actions = ActionsUnion<typeof Actions & typeof InternalActions>;

export const InternalActions = {
    addPost: (post: Post) =>
        createAction(ActionTypes.ADD_POST, { post }),
    increaseHighestSeenPostId: () =>
        createAction(ActionTypes.INCREASE_HIGHEST_SEEN_POST_ID),
    addFeed: (feed: Feed) =>
        createAction(ActionTypes.ADD_FEED, { feed }),
    addOwnFeed: (feed: LocalFeed) =>
        createAction(ActionTypes.ADD_OWN_FEED, { feed }),
    updateAuthorIdentity: (privateIdentity: PrivateIdentity) =>
        createAction(ActionTypes.UPDATE_AUTHOR_IDENTITY, { privateIdentity }),
    updateFeedFavicon: (feed: Feed, favicon: string) =>
        createAction(ActionTypes.UPDATE_FEED_FAVICON, {feed, favicon}),
    updateFeedsData: (feeds: RecentPostFeed[]) =>
        createAction(ActionTypes.UPDATE_FEEDS_DATA, { feeds }),
    appStateSet: (appState: AppState) =>
        createAction(ActionTypes.APP_STATE_SET, { appState }),
    updateAuthorName: (name: string) =>
        createAction(ActionTypes.UPDATE_AUTHOR_NAME, { name }),
    updateAuthorImage: (image: ImageData) =>
        createAction(ActionTypes.UPDATE_AUTHOR_IMAGE, { image }),
};

export const Actions = {
    ...ContactActions,
    ...PrivatePostActions,
    addContentFilter: (text: string, createdAt: number, validUntil: number) =>
        createAction(ActionTypes.ADD_CONTENT_FILTER, { text, createdAt, validUntil }),
    removeContentFilter: (filter: ContentFilter) =>
        createAction(ActionTypes.REMOVE_CONTENT_FILTER, { filter }),
    removeFeed: (feed: Feed) =>
        createAction(ActionTypes.REMOVE_FEED, { feed }),
    followFeed: (feed: Feed) =>
        createAction(ActionTypes.FOLLOW_FEED, { feed }),
    unfollowFeed: (feed: Feed) =>
        createAction(ActionTypes.UNFOLLOW_FEED, { feed }),
    toggleFeedFavorite: (feedUrl: string) =>
        createAction(ActionTypes.TOGGLE_FEED_FAVORITE, { feedUrl }),
    timeTick: () =>
        createAction(ActionTypes.TIME_TICK),
    deletePost: (post: Post) =>
        createAction(ActionTypes.DELETE_POST, { post }),
    removeAllPosts: () =>
        createAction(ActionTypes.REMOVE_ALL_POSTS),
    updatePostLink: (post: Post, link?: string) =>
        createAction(ActionTypes.UPDATE_POST_LINK, {post, link}),
    updatePostIsUploading: (post: Post, isUploading?: boolean) =>
        createAction(ActionTypes.UPDATE_POST_IS_UPLOADING, { post, isUploading }),
    updatePostImages: (post: Post, images: ImageData[]) =>
        createAction(ActionTypes.UPDATE_POST_IMAGES, {post, images}),
    updateRssPosts: (posts: Post[]) =>
        createAction(ActionTypes.UPDATE_RSS_POSTS, { posts }),
    addDraft: (draft: Post) =>
        createAction(ActionTypes.ADD_DRAFT, { draft }),
    removeDraft: () =>
        createAction(ActionTypes.REMOVE_DRAFT),
    appStateReset: () =>
        createAction(ActionTypes.APP_STATE_RESET),
    changeSettingSaveToCameraRoll: (value: boolean) =>
        createAction(ActionTypes.CHANGE_SETTING_SAVE_TO_CAMERA_ROLL, { value }),
    changeSettingShowSquareImages: (value: boolean) =>
        createAction(ActionTypes.CHANGE_SETTING_SHOW_SQUARE_IMAGES, { value }),
    changeSettingShowDebugMenu: (value: boolean) =>
        createAction(ActionTypes.CHANGE_SETTING_SHOW_DEBUG_MENU, { value }),
    changeSettingSwarmGatewayAddress: (value: string) =>
        createAction(ActionTypes.CHANGE_SETTING_SWARM_GATEWAY_ADDRESS, { value }),
    updateOwnFeed: (partialFeed: Partial<LocalFeed>) =>
        createAction(ActionTypes.UPDATE_OWN_FEED, { partialFeed }),
    cleanFeedsFromOwnFeeds: (feedUrls: string[]) =>
        createAction(ActionTypes.CLEAN_FEEDS_FROM_OWN_FEEDS, { feedUrls }),
    updateAppLastEditing: (appName: string) =>
        createAction(ActionTypes.UPDATE_APP_LAST_EDITING, { appName }),
    removeAllFeeds: () =>
        createAction(ActionTypes.REMOVE_ALL_FEEDS),
};
