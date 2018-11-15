import { ActionsUnion } from './types';
import { createAction } from './actionHelpers';
import { Feed } from '../models/Feed';
import { ContentFilter } from '../models/ContentFilter';
import { AppState } from '../reducers';
import { RSSPostManager } from '../RSSPostManager';
import { Post, PublicPost } from '../models/Post';
import { ImageData } from '../models/ImageData';
import { Debug } from '../Debug';
import { isPostFeedUrl, loadPosts, createPostFeed, updatePostFeed } from '../PostFeed';
import { makeFeedApi, generateSecureIdentity } from '../Swarm';
import { uploadPost, uploadPosts } from '../PostUpload';
import { PrivateIdentity } from '../models/Identity';

export enum ActionTypes {
    ADD_CONTENT_FILTER = 'ADD-CONTENT-FILTER',
    REMOVE_CONTENT_FILTER = 'REMOVE-CONTENT-FILTER',
    CLEANUP_CONTENT_FILTERS = 'CLEANUP-CONTENT-FILTERS',
    ADD_FEED = 'ADD-FEED',
    REMOVE_FEED = 'REMOVE-FEED',
    ADD_OWN_FEED = 'ADD-OWN-FEED',
    TIME_TICK = 'TIME-TICK',
    UPDATE_RSS_POSTS = 'UPDATE-RSS-POSTS',
    REMOVE_POST = 'REMOVE-POST',
    ADD_DRAFT = 'ADD-DRAFT',
    REMOVE_DRAFT = 'REMOVE-DRAFT',
    ADD_POST = 'ADD-POST',
    DELETE_POST = 'DELETE-POST',
    UPDATE_POST_LINK = 'UPDATE-POST-LINK',
    UPDATE_POST_IMAGES = 'UPDATE-POST-IMAGES',
    UPDATE_POST_IS_UPLOADING = 'UPDATE-POST-IS-UPLOADING',
    UPDATE_AUTHOR_NAME = 'UPDATE-AUTHOR-NAME',
    UPDATE_AUTHOR_PICTURE_PATH = 'UPDATE-AUTHOR-PICTURE-PATH',
    UPDATE_AUTHOR_IDENTITY = 'UPDATE-AUTHOR-IDENTITY',
    INCREASE_HIGHEST_SEEN_POST_ID = 'INCREASE-HIGHEST-SEEN-POST-ID',
    APP_STATE_RESET = 'APP-STATE-RESET',
}

const InternalActions = {
    addPost: (post: Post) =>
        createAction(ActionTypes.ADD_POST, { post }),
    increaseHighestSeenPostId: () =>
        createAction(ActionTypes.INCREASE_HIGHEST_SEEN_POST_ID),
    addOwnFeed: (feed: Feed) =>
        createAction(ActionTypes.ADD_OWN_FEED, { feed }),
    updateAuthorIdentity: (privateIdentity: PrivateIdentity) =>
        createAction(ActionTypes.UPDATE_AUTHOR_IDENTITY, { privateIdentity }),
};

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
    deletePost: (post: Post) =>
        createAction(ActionTypes.DELETE_POST, { post }),
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
    updateAuthorName: (name: string) =>
        createAction(ActionTypes.UPDATE_AUTHOR_NAME, { name }),
    updateAuthorPicturePath: (image: ImageData) =>
        createAction(ActionTypes.UPDATE_AUTHOR_PICTURE_PATH, { image }),
    appStateReset: () =>
        createAction(ActionTypes.APP_STATE_RESET),
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
            const feeds = getState().feeds.toArray();

            const rssFeeds = feeds.filter(feed => !isPostFeedUrl(feed.url));
            const rssPosts = await RSSPostManager.loadPosts(rssFeeds);

            const swarmFeedApi = makeFeedApi(getState().author.identity!);
            const postFeeds = feeds.filter(feed => isPostFeedUrl(feed.url));
            const postFeedPosts = await loadPosts(swarmFeedApi, postFeeds);

            const allPosts = (rssPosts as PublicPost[]).concat(postFeedPosts);
            const sortedPosts = allPosts.sort((a, b) => b.createdAt - a.createdAt);
            const posts = sortedPosts.map((post, index) => ({...post, _id: index}));

            dispatch(Actions.updateRssPosts(posts));
        };
    },
    createPost: (post: Post) => {
        return async (dispatch, getState: () => AppState) => {
            dispatch(Actions.removeDraft());
            const { metadata, author } = getState();
            post._id = metadata.highestSeenPostId + 1;
            post.author = author;
            dispatch(InternalActions.addPost(post));
            dispatch(InternalActions.increaseHighestSeenPostId());
            Debug.log('Post saved and synced, ', post._id);
        };
    },
    removePost: (post: Post) => {
        return async (dispatch, getState: () => AppState) => {
            dispatch(Actions.deletePost(post));
        };
    },
    sharePost: (post: Post) => {
        return async (dispatch, getState: () => AppState) => {
            try {

                Debug.log('sharePost: ', post);
                const ownFeeds = getState().ownFeeds.toArray();
                const swarmFeedApi = makeFeedApi(getState().author.identity!);
                if (ownFeeds.length > 0) {
                    const feed = ownFeeds[0];
                    if (post.link === feed.url) {
                        return;
                    }

                    dispatch(Actions.updatePostIsUploading(post, true));

                    const uploadedPost = await uploadPost(post);
                    Debug.log('sharePost: after uploadedPost');

                    const localFeedPosts = getState().localPosts.toArray().filter(localPost =>
                        localPost.link === feed.url
                    );
                    const feedPosts = [...localFeedPosts, uploadedPost];
                    const posts = feedPosts
                        .sort((a, b) => b.createdAt - a.createdAt)
                        .slice(0, 20)
                        ;

                    const uploadedPosts = await uploadPosts(posts);
                    const postFeed = {
                        ...feed,
                        posts: uploadedPosts,
                        authorImage: {
                            localPath: '',
                        },
                    };
                    Debug.log('sharePost: after uploadPosts');

                    await updatePostFeed(swarmFeedApi, postFeed);
                    Debug.log('sharePost: after uploadPostFeed');

                    dispatch(Actions.updatePostLink(post, feed.url));
                    dispatch(Actions.updatePostIsUploading(post, undefined));

                    const mergedImages = mergeImages(post.images, uploadedPost.images);
                    dispatch(Actions.updatePostImages(post, mergedImages));
                } else {
                    Debug.log('sharePost: create feed');

                    const author = getState().author;
                    dispatch(Actions.updatePostIsUploading(post, true));

                    const uploadedPost = await uploadPost(post);
                    const feed = await createPostFeed(swarmFeedApi, author, uploadedPost);

                    dispatch(InternalActions.addOwnFeed(feed));
                    dispatch(Actions.updatePostLink(post, feed.url));
                    dispatch(Actions.updatePostIsUploading(post, undefined));

                    const mergedImages = mergeImages(post.images, uploadedPost.images);
                    dispatch(Actions.updatePostImages(post, mergedImages));
                }
            } catch (e) {
                Debug.log('sharePost: ', e);
                dispatch(Actions.updatePostIsUploading(post, undefined));
            }
        };
    },
    chainActions: (thunks: ThunkTypes[], callback?: () => void) => {
        return async (dispatch, getState: () => AppState) => {
            for (const thunk of thunks) {
                if (isActionTypes(thunk)) {
                    dispatch(thunk);
                } else {
                    await thunk(dispatch, getState);
                }
            }
            if (callback != null) {
                callback();
            }
        };
    },
    createUserIdentity: () => {
        return async (dispatch, getState: () => AppState) => {
            const privateIdentity = await generateSecureIdentity();
            dispatch(InternalActions.updateAuthorIdentity(privateIdentity));
        };
    },
};

type Thunk = (dispatch: any, getState: () => AppState) => Promise<void>;
type ThunkTypes = Thunk | Actions;

const isActionTypes = (t: ThunkTypes): t is Actions => {
    return (t as Actions).type !== undefined;
};

export type Actions = ActionsUnion<typeof Actions & typeof InternalActions>;

const mergeImages = (localImages: ImageData[], uploadedImages: ImageData[]): ImageData[] => {
    const mergedImages: ImageData[] = [];
    for (let i = 0; i < localImages.length; i++) {
        const mergedImage: ImageData = {
            ...localImages[i],
            uri: uploadedImages[i].uri,
        };
        mergedImages.push(mergedImage);
    }
    return mergedImages;
};
