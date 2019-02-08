import { ActionsUnion } from './types';
import { createAction } from './actionHelpers';
import { Feed } from '../models/Feed';
import { ContentFilter } from '../models/ContentFilter';
import { AppState, getAppStateFromSerialized, migrateAppStateToCurrentVersion } from '../reducers';
import { RSSPostManager } from '../RSSPostManager';
import { Post, PublicPost, Author } from '../models/Post';
import { ImageData } from '../models/ImageData';
import { Debug } from '../Debug';
import { RecentPostFeed, PostCommandLog, shareNewPost } from '../social/api';
import * as Swarm from '../swarm/Swarm';
import { PrivateIdentity } from '../models/Identity';
import { restoreBackupToString } from '../BackupRestore';
// @ts-ignore
import { generateSecureRandom } from 'react-native-securerandom';
import { loadRecentPosts, makeSwarmStorage, makeSwarmStorageSyncer, SwarmHelpers } from '../swarm-social/swarmStorage';
import { isPostFeedUrl } from '../swarm-social/swarmStorage';
import { resizeImageIfNeeded } from '../ImageUtils';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';

const modelHelper = new ReactNativeModelHelper();

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
    addOwnFeed: (feed: RecentPostFeed) =>
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
    cleanupContentFilters: (currentTimestamp: number = Date.now()): Thunk => {
        return async (dispatch, getState) => {
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
    downloadFollowedFeedPosts: (): Thunk => {
        return async (dispatch, getState) => {
            const feeds = getState()
                            .feeds
                            .filter(feed => feed.followed === true);

            dispatch(AsyncActions.downloadPostsFromFeeds(feeds));
        };
    },
    downloadPostsFromFeeds: (feeds: Feed[]): Thunk => {
        return async (dispatch, getState) => {
            const previousPosts = getState().rssPosts;
            // TODO this is a hack, because we don't need a feed address
            const swarm = Swarm.makeReadableApi({user: '', topic: ''});
            const downloadedPosts = await loadPostsFromFeeds(swarm, feeds);
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
    createPost: (post: Post): Thunk => {
        return async (dispatch, getState) => {
            dispatch(Actions.removeDraft());
            const { metadata, author } = getState();
            post._id = metadata.highestSeenPostId + 1;
            post.author = author;
            dispatch(InternalActions.addPost(post));
            dispatch(InternalActions.increaseHighestSeenPostId());
            Debug.log('Post saved and synced, ', post._id);
        };
    },
    removePost: (post: Post): Thunk => {
        return async (dispatch, getState) => {
            dispatch(Actions.deletePost(post));
        };
    },
    sharePost: (post: Post): Thunk => {
        return async (dispatch, getState) => {
            const isQueueEmtpy = getState().postUploadQueue.length === 0;
            dispatch(InternalActions.queuePostForUpload(post));
            dispatch(Actions.updatePostIsUploading(post, true));
            if (isQueueEmtpy) {
                dispatch(AsyncActions.uploadPostsFromQueue());
            }
        };
    },
    uploadPostsFromQueue: (): Thunk => {
        return async (dispatch, getState) => {
            while (getState().postUploadQueue.length > 0) {
                const post = getState().postUploadQueue[0];
                await AsyncActions.uploadPostFromQueue(post)(dispatch, getState);
                dispatch(InternalActions.removePostForUpload(post));
            }
        };
    },
    uploadPostFromQueue: (post: Post): Thunk => {
        return async (dispatch, getState) => {
            try {
                Debug.log('sharePost: ', post);
                const ownFeeds = getState().ownFeeds;
                const identity = getState().author.identity!;
                const signFeedDigest = (digest: number[]) => Swarm.signDigest(digest, identity);

                if (ownFeeds.length > 0) {
                    const feed = ownFeeds[0];
                    if (post.link === feed.url) {
                        return;
                    }
                    const feedAddress = Swarm.makeFeedAddressFromBzzFeedUrl(feed.feedUrl);
                    const swarm = Swarm.makeApi(feedAddress, signFeedDigest);
                    const postOptions: SwarmHelpers = {
                        imageResizer: resizeImageIfNeeded,
                        getLocalPath: modelHelper.getLocalPath,
                    };
                    const swarmStorage = makeSwarmStorage(swarm, postOptions);
                    const swarmStorageSyncer = makeSwarmStorageSyncer(swarmStorage);

                    dispatch(Actions.updatePostIsUploading(post, true));

                    const localFeedPosts = getState().localPosts.filter(localPost =>
                        localPost.link === feed.url
                    );
                    const localPostCommandLog: PostCommandLog = {
                        commands: localFeedPosts.map(p => shareNewPost(p, 'local', {commands: []}).commands[0]),
                    };
                    const updatedStorage = swarmStorageSyncer.sync(localPostCommandLog, feed);
                    // TODO await updateRecentPostFeed(swarm, postFeed);

                    dispatch(Actions.updatePostLink(post, feed.url));
                    dispatch(Actions.updatePostIsUploading(post, undefined));

                    // const mergedImages = mergeImages(post.images, uploadedPost.images);
                    // dispatch(Actions.updatePostImages(post, mergedImages));
                // } else {
                //     Debug.log('sharePost: create feed');

                //     const author = getState().author;
                //     dispatch(Actions.updatePostIsUploading(post, true));

                //     const feedAddress = Swarm.makeFeedAddressFromPublicIdentity(identity);
                //     const swarm = Swarm.makeApi(feedAddress, signFeedDigest);
                //     const uploadedPost = await uploadPost(swarm.bzz, post, resizeImageIfNeeded, modelHelper);

                //     const feed = await createRecentPostFeed(swarm, author, uploadedPost, resizeImageIfNeeded, modelHelper);

                //     dispatch(InternalActions.addOwnFeed(feed));
                //     dispatch(Actions.updatePostLink(post, feed.url));
                //     dispatch(Actions.updatePostIsUploading(post, undefined));

                //     const mergedImages = mergeImages(post.images, uploadedPost.images);
                //     dispatch(Actions.updatePostImages(post, mergedImages));
                }
            } catch (e) {
                Debug.log('sharePost: ', 'error', e);
                dispatch(Actions.updatePostIsUploading(post, undefined));
            }
        };
    },
    chainActions: (thunks: ThunkTypes[], callback?: () => void): Thunk => {
        return async (dispatch, getState) => {
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
    createUserIdentity: (): Thunk => {
        return async (dispatch, getState: () => AppState) => {
            const privateIdentity = await Swarm.generateSecureIdentity(generateSecureRandom);
            dispatch(InternalActions.updateAuthorIdentity(privateIdentity));
        };
    },
    restoreFromBackup: (backupText: string, secretHex: string): Thunk => {
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

const loadPostsFromFeeds = async (swarm: Swarm.ReadableApi, feeds: Feed[]): Promise<Post[]> => {
    const rssFeeds = feeds.filter(feed => !isPostFeedUrl(feed.url));
    const postFeeds = feeds.filter(feed => isPostFeedUrl(feed.url));
    const allPostsCombined = await Promise.all([
        RSSPostManager.loadPosts(rssFeeds) as Promise<PublicPost[]>,
        loadRecentPosts(swarm, postFeeds),
    ]);

    const allPosts = allPostsCombined[0].concat(allPostsCombined[1]);
    return allPosts;
};
