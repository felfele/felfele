import { ActionsUnion } from './types';
import { createAction } from './actionHelpers';
import { Feed } from '../models/Feed';
import { ContentFilter } from '../models/ContentFilter';
import { migrateAppStateToCurrentVersion } from '../reducers';
import { AppState } from '../reducers/AppState';
import { RSSPostManager } from '../RSSPostManager';
import { Post, PublicPost } from '../models/Post';
import { ImageData } from '../models/ImageData';
import { Debug } from '../Debug';
import { Utils } from '../Utils';
import {
    LocalFeed,
    shareNewPost,
    removePost,
    mergePostCommandLogs,
    getPreviousCommandEpochFromLog,
} from '../social/api';
import * as Swarm from '../swarm/Swarm';
import { PrivateIdentity } from '../models/Identity';
// @ts-ignore
import { generateSecureRandom } from 'react-native-securerandom';
import { isPostFeedUrl, loadRecentPosts, makeSwarmStorage, makeSwarmStorageSyncer, SwarmHelpers } from '../swarm-social/swarmStorage';
import { resizeImageIfNeeded, resizeImageForPlaceholder } from '../ImageUtils';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';
import { FELFELE_ASSISTANT_URL, FELFELE_FOUNDATION_URL } from '../reducers/defaultData';
import { registerBackgroundTask } from '../helpers/backgroundTask';
import { localNotification } from '../helpers/notifications';
import { mergeUpdatedPosts } from '../helpers/postHelpers';
import { createInvitedContact } from '../helpers/contactHelpers';
import { createSwarmContactRandomHelper } from '../helpers/swarmContactHelpers';
import { Contact, NonMutualContact } from '../models/Contact';

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
    UPDATE_OWN_FEED = 'UPDATE-OWN-FEED',
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
    UPDATE_AUTHOR_IMAGE = 'UPDATE-AUTHOR-IMAGE',
    UPDATE_AUTHOR_IDENTITY = 'UPDATE-AUTHOR-IDENTITY',
    INCREASE_HIGHEST_SEEN_POST_ID = 'INCREASE-HIGHEST-SEEN-POST-ID',
    APP_STATE_RESET = 'APP-STATE-RESET',
    APP_STATE_SET = 'APP-STATE-SET',
    CHANGE_SETTING_SAVE_TO_CAMERA_ROLL = 'CHANGE-SETTING-SAVE-TO-CAMERA-ROLL',
    CHANGE_SETTING_SHOW_SQUARE_IMAGES = 'CHANGE-SETTING-SHOW-SQUARE-IMAGES',
    CHANGE_SETTING_SHOW_DEBUG_MENU = 'CHANGE-SETTING-SHOW-DEBUG-MENU',
    CHANGE_SETTING_SWARM_GATEWAY_ADDRESS = 'CHANGE-SETTING-SWARM-GATEWAY-ADDRESS',
    CLEAN_FEEDS_FROM_OWN_FEEDS = 'CLEAN-FEEDS-FROM-OWN-FEEDS',
    ADD_CONTACT = 'ADD-CONTACT',
    UPDATE_CONTACT_STATE = 'UPDATE-CONTACT-STATE',
    DELETE_CONTACTS = 'DELETE-CONTACTS',
}

const InternalActions = {
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
    appStateSet: (appState: AppState) =>
        createAction(ActionTypes.APP_STATE_SET, { appState }),
    updateAuthorName: (name: string) =>
        createAction(ActionTypes.UPDATE_AUTHOR_NAME, { name }),
    updateAuthorImage: (image: ImageData) =>
        createAction(ActionTypes.UPDATE_AUTHOR_IMAGE, { image }),
};

export const Actions = {
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
    addContact: (contact: Contact) =>
        createAction(ActionTypes.ADD_CONTACT, { contact }),
    updateContactState: (contact: NonMutualContact, updatedContact: Contact) =>
        createAction(ActionTypes.UPDATE_CONTACT_STATE, { contact, updatedContact }),
    deleteContacts: () =>
        createAction(ActionTypes.DELETE_CONTACTS, {}),
};

export const AsyncActions = {
    addFeed: (feed: Feed): Thunk => {
        return async (dispatch, getState) => {
            const ownFeeds = getState().ownFeeds.map(ownFeed => ownFeed.feedUrl);
            if (!ownFeeds.includes(feed.feedUrl)) {
                dispatch(InternalActions.addFeed(feed));
            }
        };
    },
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
    cleanUploadingPostState: (): Thunk => {
        return async (dispatch, getState) => {
            for (const post of getState().localPosts) {
                if (post.isUploading === true) {
                    dispatch(Actions.updatePostIsUploading(post, undefined));
                }
            }
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
            Debug.log('downloadPostsFromFeeds', feeds);
            const previousPosts = getState().rssPosts;
            // TODO this is a hack, because we don't need a feed address
            const swarm = Swarm.makeReadableApi({user: '', topic: ''}, getState().settings.swarmGatewayAddress);
            const downloadedPosts = await loadPostsFromFeeds(swarm, feeds);
            const posts = mergeUpdatedPosts(downloadedPosts, previousPosts);
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

            const ownFeeds = getState().ownFeeds;
            if (ownFeeds.length > 0) {
                const localFeed = getState().ownFeeds[0];
                if (localFeed.autoShare) {
                    dispatch(AsyncActions.sharePost(post));
                }
            }
        };
    },
    removePost: (post: Post): Thunk => {
        return async (dispatch, getState) => {
            const ownFeeds = getState().ownFeeds;
            if (post.link != null && ownFeeds.length > 0) {
                const localFeed = ownFeeds[0];
                const updatedPostCommandLog = removePost(post, '', localFeed.postCommandLog);
                dispatch(Actions.updateOwnFeed({
                    ...localFeed,
                    postCommandLog: updatedPostCommandLog,
                }));
                dispatch(AsyncActions.syncLocalFeed(localFeed));
            }
            dispatch(Actions.deletePost(post));
        };
    },
    sharePost: (post: Post): Thunk => {
        return async (dispatch, getState) => {
            Debug.log('sharePost', 'post', post);
            const author = getState().author;
            if (post.author != null &&
                post.author.identity != null &&
                post.author.identity.publicKey === author.identity!.publicKey
            ) {
                dispatch(AsyncActions.shareOwnPost(post));
            }
            else {
                dispatch(AsyncActions.shareOthersPost(post));
            }
        };
    },
    shareOthersPost: (post: Post): Thunk => {
        return async (dispatch, getState) => {
            const { metadata, author } = getState();
            const id = metadata.highestSeenPostId + 1;
            const newPost: Post = {
                ...post,
                _id: id,
                author,
                updatedAt: Date.now(),
                references: {
                    parent: post.link ? post.link : '',
                    original: post.references != null
                        ? post.references.original
                        : post.link != null
                            ? post.link
                            : ''
                    ,
                    originalAuthor: post.references != null
                        ? post.references.originalAuthor
                        : post.author != null
                            ? post.author
                            : {
                                name: '',
                                uri: '',
                                image: {},
                            }
                    ,
                },
            };

            dispatch(InternalActions.addPost(newPost));
            dispatch(InternalActions.increaseHighestSeenPostId());
            dispatch(AsyncActions.shareOwnPost(newPost));
        };
    },
    createOwnFeed: (): Thunk => {
        return async (dispatch, getState) => {
            const identity = getState().author.identity!;
            const address = Swarm.makeFeedAddressFromPublicIdentity(identity);
            const feedUrl = Swarm.makeBzzFeedUrl(address);
            const author = getState().author;
            const ownFeed: LocalFeed = {
                posts: [],
                authorImage: author.image,
                name: author.name,
                url: feedUrl,
                feedUrl,
                favicon: author.image.uri || '',
                postCommandLog: {
                    commands: [],
                },
                isSyncing: false,
                autoShare: true,
            };
            dispatch(InternalActions.addOwnFeed(ownFeed));
            dispatch(AsyncActions.syncLocalFeed(ownFeed));
        };
    },
    shareOwnPost: (post: Post): Thunk => {
        return async (dispatch, getState) => {
            if (getState().ownFeeds[0] == null) {
                await dispatch(AsyncActions.createOwnFeed());
            }
            const localFeed = getState().ownFeeds[0];
            dispatch(Actions.updatePostIsUploading(post, true));

            const updatedPostCommandLog = shareNewPost(post, '', localFeed.postCommandLog);
            dispatch(Actions.updateOwnFeed({
                ...localFeed,
                postCommandLog: updatedPostCommandLog,
            }));
            dispatch(AsyncActions.syncLocalFeed(localFeed));
        };
    },
    syncLocalFeed: (feed: LocalFeed): Thunk => {
        return async (dispatch, getState) => {
            Debug.log('syncPostCommandLogs', 'feed', feed);
            const localFeed = getState().ownFeeds.find(ownFeed => ownFeed.feedUrl === feed.feedUrl);
            if (localFeed == null) {
                return;
            }
            if (localFeed.isSyncing === true) {
                return;
            }

            const localFeedToSync = {
                ...localFeed,
                authorImage: getState().author.image,
                name: getState().author.name,
                isSyncing: true,
            };
            dispatch(Actions.updateOwnFeed({
                ...localFeedToSync,
            }));

            const identity = getState().author.identity!;
            const signFeedDigest = (digest: number[]) => Swarm.signDigest(digest, identity);
            const swarmGateway = getState().settings.swarmGatewayAddress;
            const swarmStorageSyncer = getSwarmStorageSyncer(signFeedDigest, localFeedToSync.feedUrl, swarmGateway);

            const localPostCommandLog = localFeedToSync.postCommandLog;

            try {
                const storageSyncUpdate = await swarmStorageSyncer.sync(localPostCommandLog, localFeedToSync);
                Debug.log('syncPostCommandLogs', 'storageSyncUpdate', storageSyncUpdate);

                storageSyncUpdate.updatedPosts.map(updatedPost => {
                    // TODO also check for:
                    // - deleted posts
                    // - not uploaded posts
                    dispatch(Actions.updatePostLink(updatedPost, localFeedToSync.url));
                    dispatch(Actions.updatePostIsUploading(updatedPost, undefined));
                    const localPosts = getState().localPosts;
                    const originalPost = localPosts.find(p => p._id === updatedPost.author);
                    if (originalPost != null) {
                        const mergedImages = mergeImages(originalPost.images, updatedPost.images);
                        dispatch(Actions.updatePostImages(updatedPost, mergedImages));
                    }
                    return updatedPost;
                });

                if (getState().author.image.uri == null) {
                    const authorImage = {
                        ...getState().author.image,
                        uri: storageSyncUpdate.recentPostFeed.authorImage.uri,
                    };
                    dispatch(InternalActions.updateAuthorImage(authorImage));
                }

                // Re-check if there were an update to the command log during syncing
                const localFeedAfterUpdate = getState().ownFeeds.find(ownFeed => ownFeed.feedUrl === localFeedToSync.feedUrl);
                if (localFeedAfterUpdate == null) {
                    return;
                }
                const localPostCommandLogAfterUpdate = localFeedAfterUpdate.postCommandLog;
                const mergedPostCommandLog = mergePostCommandLogs(
                    localPostCommandLogAfterUpdate,
                    storageSyncUpdate.postCommandLog,
                );

                Debug.log('syncPostCommandLogs', 'mergedPostCommandLog', mergedPostCommandLog);

                dispatch(Actions.updateOwnFeed({
                    ...localFeedAfterUpdate,
                    postCommandLog: mergedPostCommandLog,
                    isSyncing: false,
                }));

                if (mergedPostCommandLog.commands.length > 0 &&
                    getPreviousCommandEpochFromLog(mergedPostCommandLog) == null
                ) {
                    Debug.log('syncPostCommandLogs', 'waiting for resyncing');
                    await Utils.waitMillisec(60 * 1000);
                    dispatch(AsyncActions.syncLocalFeed(localFeedAfterUpdate));
                }
            } catch (e) {
                Debug.log('syncPostCommandLogs: ', 'error', e);
                dispatch(AsyncActions.cleanUploadingPostState());
                dispatch(Actions.updateOwnFeed({
                    feedUrl: localFeed.feedUrl,
                    isSyncing: false,
                }));
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
    createUser: (name: string, image: ImageData): Thunk => {
        return async (dispatch, getState) => {
            await dispatch(AsyncActions.chainActions([
                AsyncActions.updateProfileName(name),
                AsyncActions.updateProfileImage(image),
                AsyncActions.createUserIdentity(),
                AsyncActions.createOwnFeed(),
            ]));
        };
    },
    createUserIdentity: (): Thunk => {
        return async (dispatch, getState) => {
            const privateIdentity = await Swarm.generateSecureIdentity(generateSecureRandom);
            dispatch(InternalActions.updateAuthorIdentity(privateIdentity));
        };
    },
    restoreAppStateFromBackup: (appState: AppState): Thunk => {
        return async (dispatch, getState) => {
            const currentVersionAppState = await migrateAppStateToCurrentVersion(appState);
            dispatch(InternalActions.appStateSet(currentVersionAppState));
        };
    },
    updateProfileName: (name: string): Thunk => {
        return async (dispatch, getState) => {
            dispatch(InternalActions.updateAuthorName(name));
            if (getState().ownFeeds.length > 0) {
                const ownFeed = getState().ownFeeds[0];
                dispatch(Actions.updateOwnFeed({
                    feedUrl: ownFeed.feedUrl,
                    name,
                }));
                dispatch(AsyncActions.syncLocalFeed(ownFeed));
            }
        };
    },
    updateProfileImage: (image: ImageData): Thunk => {
        return async (dispatch, getState) => {
            dispatch(InternalActions.updateAuthorImage(image));
            if (getState().ownFeeds.length > 0) {
                const ownFeed = getState().ownFeeds[0];
                dispatch(Actions.updateOwnFeed({
                    feedUrl: ownFeed.feedUrl,
                    authorImage: image,
                    favicon: undefined,
                }));
                dispatch(AsyncActions.syncLocalFeed(ownFeed));
            }
        };
    },
    registerBackgroundTasks: (): Thunk => {
        return async (dispatch, getState) => {
            const foundationFeeds = getState().feeds.filter(feed => feed.feedUrl === FELFELE_FOUNDATION_URL);
            if (foundationFeeds.length > 0) {
                const foundationFeed = foundationFeeds[0];
                const getLatestPostCreateTime = (posts: Post[]) => posts.length > 0
                    ? posts[0].createdAt
                    : 0
                ;
                const backgroundTaskIntervalMinutes = 12 * 60;
                registerBackgroundTask(backgroundTaskIntervalMinutes, async () => {
                    const previousPosts = getState().rssPosts.filter(post => post.author != null && post.author.uri ===  foundationFeed.feedUrl);
                    const previousSortedPosts = previousPosts.sort((a, b) => b.createdAt - a.createdAt);
                    const address = Swarm.makeFeedAddressFromBzzFeedUrl(foundationFeeds[0].feedUrl);
                    const swarm = Swarm.makeReadableApi(address, getState().settings.swarmGatewayAddress);
                    const recentPosts = await loadRecentPosts(swarm, foundationFeeds);
                    if (getLatestPostCreateTime(recentPosts) > getLatestPostCreateTime(previousSortedPosts)) {
                        const posts = mergeUpdatedPosts(recentPosts, previousPosts);
                        dispatch(Actions.updateRssPosts(posts));
                        localNotification('There is a new version available!');
                    }
                });
            }
        };
    },
    generateInvitedContact: (): Thunk => {
        return async (dispatch, getState) => {
            const contactRandomHelper = createSwarmContactRandomHelper(generateSecureRandom);
            const createdAt = Date.now();
            const invitedContact = await createInvitedContact(contactRandomHelper, createdAt);
            dispatch(Actions.addContact(invitedContact));
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
    const feedsWithoutOnboarding = feeds.filter(feed => feed.feedUrl !== FELFELE_ASSISTANT_URL);
    const rssFeeds = feedsWithoutOnboarding.filter(feed => !isPostFeedUrl(feed.url));
    const postFeeds = feedsWithoutOnboarding.filter(feed => isPostFeedUrl(feed.url));
    const allPostsCombined = await Promise.all([
        RSSPostManager.loadPosts(rssFeeds) as Promise<PublicPost[]>,
        loadRecentPosts(swarm, postFeeds),
    ]);

    const allPosts = allPostsCombined[0].concat(allPostsCombined[1]);
    return allPosts;
};

const getSwarmStorageSyncer = (signFeedDigest: Swarm.FeedDigestSigner, feedUrl: string, swarmGateway: string) => {
    const feedAddress = Swarm.makeFeedAddressFromBzzFeedUrl(feedUrl);
    const swarm = Swarm.makeApi(feedAddress, signFeedDigest, swarmGateway);
    const modelHelper = new ReactNativeModelHelper(swarmGateway);
    const swarmHelpers: SwarmHelpers = {
        imageResizer: {
            resizeImage: resizeImageIfNeeded,
            resizeImageForPlaceholder,
        },
        getLocalPath: modelHelper.getLocalPath,
    };
    const swarmStorage = makeSwarmStorage(swarm, swarmHelpers);
    const swarmStorageSyncer = makeSwarmStorageSyncer(swarmStorage);
    return swarmStorageSyncer;
};
