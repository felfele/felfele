import { ActionsUnion } from './types';
import { createAction } from './actionHelpers';
import { Feed } from '../models/Feed';
import { ContentFilter } from '../models/ContentFilter';
import { AppState } from '../reducers';
import { RSSPostManager } from '../RSSPostManager';
import { Post } from '../models/Post';
import { LocalPostManager } from '../LocalPostManager';
import { Debug } from '../Debug';

export enum ActionTypes {
    ADD_CONTENT_FILTER = 'ADD-CONTENT-FILTER',
    REMOVE_CONTENT_FILTER = 'REMOVE-CONTENT-FILTER',
    CLEANUP_CONTENT_FILTERS = 'CLEANUP-CONTENT-FILTERS',
    ADD_FEED = 'ADD-FEED',
    REMOVE_FEED = 'REMOVE-FEED',
    TIME_TICK = 'TIME-TICK',
    UPDATE_RSS_POSTS = 'UPDATE-RSS-POSTS',
    REMOVE_POST = 'REMOVE-POST',
    ADD_DRAFT = 'ADD-DRAFT',
    REMOVE_DRAFT = 'REMOVE-DRAFT',
    LOCAL_POSTS_LOADED = 'LOCAL-POSTS-LOADED',
    ADD_POST = 'ADD-POST',
    DELETE_POST = 'DELETE-POST',
}

export const Actions = {
    addContentFilter: (text: string, createdAt: number, validUntil: number) =>
        createAction(ActionTypes.ADD_CONTENT_FILTER, { text, createdAt, validUntil }),
    removeContentFilter: (filter: ContentFilter) =>
        createAction(ActionTypes.REMOVE_CONTENT_FILTER, { filter }),
    addFeed: (feed: Feed) =>
        createAction(ActionTypes.ADD_FEED, { feed }),
    removeFeed: (feed: Feed) =>
        createAction(ActionTypes.REMOVE_FEED, { feed }),
    timeTick: () =>
        createAction(ActionTypes.TIME_TICK),
    localPostsLoaded: (posts: Post[]) =>
        createAction(ActionTypes.LOCAL_POSTS_LOADED, { posts }),
    addPost: (post: Post) =>
        createAction(ActionTypes.ADD_POST, { post }),
    deletePost: (post: Post) =>
        createAction(ActionTypes.DELETE_POST, { post }),
    updateRssPosts: (posts: Post[]) =>
        createAction(ActionTypes.UPDATE_RSS_POSTS, { posts }),
    addDraft: (draft: Post) =>
        createAction(ActionTypes.ADD_DRAFT, { draft }),
    removeDraft: () =>
        createAction(ActionTypes.REMOVE_DRAFT),
};

export const AsyncActions = {
    cleanupContentFilters: (currentTimestamp: number = Date.now()) => {
        return async (dispatch, getState: () => AppState) => {
            const expiredFilters = getState().contentFilters.filter(filter =>
                filter ? filter.createdAt + filter.validUntil < currentTimestamp : false
            );
            expiredFilters.map(filter => {
                if (filter != null) {
                    dispatch(Actions.removeContentFilter(filter));
                }
            });
        };
    },
    downloadRssPosts: () => {
        return async (dispatch, getState: () => AppState) => {
            await RSSPostManager.loadPosts();
            const posts = RSSPostManager.getAllPosts();
            dispatch(Actions.updateRssPosts(posts));
        };
    },
    loadLocalPosts: () => {
        return async (dispatch, getState: () => AppState) => {
            const posts = await LocalPostManager.loadPosts();
            dispatch(Actions.localPostsLoaded(posts));
        };
    },
    addPost: (post: Post) => {
        return async (dispatch, getState: () => AppState) => {
            if (post._id == null) {
                await LocalPostManager.deleteDraft();
            }
            await LocalPostManager.saveAndSyncPost(post);
            dispatch(Actions.addPost(post));
            Debug.log('Post saved and synced, ', post._id);
        };
    },
    removePost: (post: Post) => {
        return async (dispatch, getState: () => AppState) => {
            await LocalPostManager.deletePost(post);
            dispatch(Actions.deletePost(post));
        };
    },
};

export type Actions = ActionsUnion<typeof Actions>;
