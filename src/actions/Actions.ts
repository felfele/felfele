import { ActionsUnion } from './types';
import { createAction } from './actionHelpers';
import { Feed } from '../models/Feed';
import { ContentFilter } from '../models/ContentFilter';
import { AppState, getAppStateFromSerialized, migrateAppStateToCurrentVersion } from '../reducers';
import { RSSPostManager } from '../RSSPostManager';
import { Post, PublicPost, Author } from '../models/Post';
import { ImageData } from '../models/ImageData';
import { Debug } from '../Debug';
import { isPostFeedUrl, loadPosts, createPostFeed, updatePostFeed, downloadPostFeed, PostFeed } from '../PostFeed';
import { makeFeedApi, generateSecureIdentity, downloadFeed } from '../Swarm';
import { uploadPost, uploadPosts, uploadImage } from '../PostUpload';
import { PrivateIdentity } from '../models/Identity';
import { restoreBackupToString } from '../BackupRestore';
import { downloadImageAndStore } from '../ImageDownloader';

export enum ActionTypes {
    ADD_CONTENT_FILTER = 'ADD-CONTENT-FILTER',
    REMOVE_CONTENT_FILTER = 'REMOVE-CONTENT-FILTER',
    CLEANUP_CONTENT_FILTERS = 'CLEANUP-CONTENT-FILTERS',
    ADD_FEED = 'ADD-FEED',
    REMOVE_FEED = 'REMOVE-FEED',
    FOLLOW_FEED = 'FOLLOW-FEED',
    UNFOLLOW_FEED = 'UNFOLLOW-FEED',
    TOGGLE_FEED_FAVORITE = 'TOGGLE-FEED-FAVORITE',
    UPDATE_FEED_FAVICON = 'UPDATE-FEED-FAVICON',
    UPDATE_FEED_LOCAL_FAVICON = 'UPDATE-FEED-LOCAL-FAVICON',
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
    APP_STATE_SET = 'APP-STATE-SET',
    CHANGE_SETTING_SAVE_TO_CAMERA_ROLL = 'CHANGE-SETTING-SAVE-TO-CAMERA-ROLL',
    CHANGE_SETTING_SHOW_SQUARE_IMAGES = 'CHANGE-SETTING-SHOW-SQUARE-IMAGES',
    CHANGE_SETTING_SHOW_DEBUG_MENU = 'CHANGE-SETTING-SHOW-DEBUG-MENU',
    QUEUE_POST_FOR_UPLOAD = 'QUEUE-POST-FOR-UPLOAD',
    REMOVE_POST_FOR_UPLOAD = 'REMOVE-POST-FOR-UPLOAD',
}

const InternalActions = {
    addPost: (post: Post) =>
        createAction(ActionTypes.ADD_POST, { post }),
    increaseHighestSeenPostId: () =>
        createAction(ActionTypes.INCREASE_HIGHEST_SEEN_POST_ID),
    addOwnFeed: (feed: PostFeed) =>
        createAction(ActionTypes.ADD_OWN_FEED, { feed }),
    updateAuthorIdentity: (privateIdentity: PrivateIdentity) =>
        createAction(ActionTypes.UPDATE_AUTHOR_IDENTITY, { privateIdentity }),
    queuePostForUpload: (post: Post) =>
        createAction(ActionTypes.QUEUE_POST_FOR_UPLOAD, { post }),
    removePostForUpload: (post: Post) =>
        createAction(ActionTypes.REMOVE_POST_FOR_UPLOAD, { post }),
    updateFeedFavicon: (feed: Feed, favicon: string) =>
        createAction(ActionTypes.UPDATE_FEED_FAVICON, {feed, favicon}),
    appStateSet: (appState: AppState) =>
        createAction(ActionTypes.APP_STATE_SET, { appState }),
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
    updateFeedLocalFavicon: (feed: Feed, localFavicon: string) =>
        createAction(ActionTypes.UPDATE_FEED_LOCAL_FAVICON, {feed, localFavicon}),
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
    changeSettingSaveToCameraRoll: (value: boolean) =>
        createAction(ActionTypes.CHANGE_SETTING_SAVE_TO_CAMERA_ROLL, { value }),
    changeSettingShowSquareImages: (value: boolean) =>
        createAction(ActionTypes.CHANGE_SETTING_SHOW_SQUARE_IMAGES, { value }),
    changeSettingShowDebugMenu: (value: boolean) =>
        createAction(ActionTypes.CHANGE_SETTING_SHOW_DEBUG_MENU, { value }),
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
    downloadFollowedFeedPosts: () => {
        return async (dispatch, getState: () => AppState) => {
            const feeds = getState()
                            .feeds
                            .toArray()
                            .filter(feed => feed.followed === true);

            dispatch(AsyncActions.downloadPostsFromFeeds(feeds));
        };
    },
    downloadPostsFromFeeds: (feeds: Feed[]) => {
        return async (dispatch, getState: () => AppState) => {
            const previousPosts = getState().rssPosts.toArray();
            const downloadedPosts = await loadPostsFromFeeds(feeds);
            const uniqueAuthors = new Map<string, Author>();
            downloadedPosts.map(post => {
                if (post.author != null) {
                    if (!uniqueAuthors.has(post.author.uri)) {
                        uniqueAuthors.set(post.author.uri, post.author);
                    }
                }
            });
            const notUpdatedPosts = previousPosts.filter(post => post.author != null && !uniqueAuthors.has(post.author.uri));
            const allPosts = notUpdatedPosts.concat(downloadedPosts);
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
            const isQueueEmtpy = getState().postUploadQueue.size === 0;
            dispatch(InternalActions.queuePostForUpload(post));
            dispatch(Actions.updatePostIsUploading(post, true));
            if (isQueueEmtpy) {
                dispatch(AsyncActions.uploadPostsFromQueue());
            }
        };
    },
    uploadPostsFromQueue: () => {
        return async (dispatch, getState: () => AppState) => {
            while (getState().postUploadQueue.size > 0) {
                const post = getState().postUploadQueue.first();
                await AsyncActions.uploadPostFromQueue(post)(dispatch, getState);
                dispatch(InternalActions.removePostForUpload(post));
            }
        };
    },
    uploadPostFromQueue: (post: Post) => {
        return async (dispatch, getState: () => AppState) => {
            try {
                Debug.log('sharePost: ', post);
                const ownFeeds = getState().ownFeeds.toArray();
                const author = getState().author;
                const swarmFeedApi = makeFeedApi(author.identity!);
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
                        .map(p => ({
                            ...p,
                            images: p.images.map(image => ({
                                ...image,
                                localPath: undefined,
                            })),
                        }))
                        ;

                    const uploadedPosts = await uploadPosts(posts);
                    const authorImage = await uploadImage(author.image);
                    const postFeed = {
                        ...feed,
                        posts: uploadedPosts,
                        authorImage: {
                            ...authorImage,
                            localPath: undefined,
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
                Debug.log('sharePost: ', 'error', e);
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
    fixFeedFavicons: () => {
        return async (dispatch, getState: () => AppState) => {
            const feeds = getState().feeds.toArray().filter(feed => isPostFeedUrl(feed.url));
            for (const feed of feeds) {
                if (feed.favicon == null || feed.favicon === '') {
                    const downloadedFeed = await downloadPostFeed(feed.url);
                    if (downloadedFeed.favicon !== '') {
                        dispatch(InternalActions.updateFeedFavicon(feed, downloadedFeed.favicon));
                    }
                }
            }
        };
    },
    restoreFromBackup: (backupText: string, secretHex: string) => {
        return async (dispatch, getState: () => AppState) => {
            const serializedAppState = await restoreBackupToString(backupText, secretHex);
            const appState = await getAppStateFromSerialized(serializedAppState);
            const currentVersionAppState = await migrateAppStateToCurrentVersion(appState);
            dispatch(InternalActions.appStateSet(currentVersionAppState));
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

const loadPostsFromFeeds = async (feeds: Feed[]): Promise<Post[]> => {
    const rssFeeds = feeds.filter(feed => !isPostFeedUrl(feed.url));
    const postFeeds = feeds.filter(feed => isPostFeedUrl(feed.url));

    const allPostsCombined = await Promise.all([
        RSSPostManager.loadPosts(rssFeeds) as Promise<PublicPost[]>,
        loadPosts(postFeeds),
    ]);

    const allPosts = allPostsCombined[0].concat(allPostsCombined[1]);
    return allPosts;
};
