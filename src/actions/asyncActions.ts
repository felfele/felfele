import { Feed } from '../models/Feed';
import { AppState } from '../reducers/AppState';
import { Actions, InternalActions } from './Actions';
import { migrateAppStateToCurrentVersion } from '../store';
import * as Swarm from '../swarm/Swarm';
import { RSSPostManager } from '../RSSPostManager';
import {
    isPostFeedUrl,
    makeSwarmPostStorage,
    makeSwarmPostStorageSyncer,
    loadRecentPostFeeds,
    getPostsFromRecentPostFeeds,
    SwarmHelpers,
    RecentPostFeedUpdate,
} from '../swarm-social/swarmStorage';
import { resizeImageIfNeeded, resizeImageForPlaceholder } from '../ImageUtils';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';
import { FELFELE_ASSISTANT_URL } from '../reducers/defaultData';
import {
    createInvitedContact,
    deriveSharedKey,
    advanceContactState,
    ContactHelper,
} from '../helpers/contactHelpers';
import {
    createSwarmContactRandomHelper,
    createSwarmContactHelper,
} from '../helpers/swarmContactHelpers';
// @ts-ignore
import { generateSecureRandom } from 'react-native-securerandom';
import {
    mergeUpdatedPosts,
    copyPostWithReferences,
    createPostWithLinkMetaData,
    makePostId,
    copyPostPrivately,
} from '../helpers/postHelpers';
import { Debug } from '../Debug';
import { Utils } from '../Utils';
import {
    LocalFeed,
    shareNewPost,
    mergePostCommandLogs,
    getPreviousCommandEpochFromLog,
    RecentPostFeed,
} from '../social/api';
import { Post } from '../models/Post';
import { ImageData } from '../models/ImageData';
import { isContactFeed, makeContactFromRecentPostFeed, makeBzzFeedUrlFromIdentity } from '../helpers/feedHelpers';
import { ContactFeed } from '../models/ContactFeed';
import {
    Contact,
    MutualContact,
    NonMutualContact,
} from '../models/Contact';
import { ContactActions } from './ContactActions';
import { ThunkTypes, Thunk, isActionTypes } from './actionHelpers';
import { SwarmStorage } from '../cli/protocolTest/SwarmStorage';
import { makeNaclEncryption, Crypto } from '../cli/protocolTest/protocolTestHelpers';
import { HexString } from '../helpers/opaqueTypes';
import {
    calculatePrivateTopic,
    PrivateChannelCommand,
} from '../protocols/privateSharing';
import { PrivateIdentity } from '../models/Identity';
import { SECOND } from '../DateUtils';
import { getNonMutualContacts, getMutualContacts } from '../selectors/selectors';
import {
    syncPrivateChannelWithContact,
    applyPrivateChannelUpdate,
    privateChannelAddPost,
    privateChannelRemovePost,
} from '../protocols/privateChannel';
import { uploadImage as swarmStorageUploadImage } from '../swarm-social/swarmStorage';

export const AsyncActions = {
    addFeed: (feed: Feed): Thunk => {
        return async (dispatch, getState) => {
            const ownFeeds = getState().ownFeeds.map(ownFeed => ownFeed.feedUrl);
            if (!ownFeeds.includes(feed.feedUrl)) {
                dispatch(InternalActions.addFeed(feed));
            }
        };
    },
    addContact: (contact: Contact): Thunk => {
        return async (dispatch, getState) => {
            const identity = getState().author.identity!;
            if (contact.type === 'mutual-contact' && contact.identity.publicKey === identity.publicKey) {
                return;
            }
            dispatch(ContactActions.addContact(contact));
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
            const feedsWithoutOnboarding = feeds.filter(feed => feed.feedUrl !== FELFELE_ASSISTANT_URL);
            const swarmGatewayAddress = getState().settings.swarmGatewayAddress;
            // TODO this is a hack, because we don't need a feed address
            const swarm = Swarm.makeReadableApi({user: '', topic: ''}, swarmGatewayAddress);
            const updateFeeds = (recentPostFeedUpdates: RecentPostFeedUpdate[]) => {
                for (const feedUpdate of recentPostFeedUpdates) {
                    Debug.log('downloadPostsFromFeeds.updateFeeds', feedUpdate);
                    if (!isContactFeed(feedUpdate.original) &&
                        feedUpdate.updated.publicKey != null
                    ) {
                        const mutualContact = makeContactFromRecentPostFeed(feedUpdate.updated);
                        if (mutualContact != null) {
                            dispatch(AsyncActions.addContact(mutualContact));
                            dispatch(Actions.removeFeed(feedUpdate.original));
                        }
                    }
                }
                const recentPostFeeds = recentPostFeedUpdates.map(update => update.updated);
                dispatch(InternalActions.updateFeedsData(recentPostFeeds));
            };
            const allPosts = await Promise.all([
                loadSocialPostsAndUpdateFeeds(swarm, feedsWithoutOnboarding, updateFeeds),
                loadRSSPostsFromFeeds(feedsWithoutOnboarding),
            ]);
            const posts = mergeUpdatedPosts(allPosts[0].concat(allPosts[1]), previousPosts);
            dispatch(Actions.updateRssPosts(posts));
        };
    },
    syncPrivateChannels: (): Thunk => {
        return async (dispatch, getState) => {
            const mutualContacts = getMutualContacts(getState());
            await dispatch(AsyncActions.syncPrivatePostsWithContacts(mutualContacts));
        };
    },
    syncUnsyncedPrivateChannels: (): Thunk => {
        return async (dispatch, getState) => {
            const mutualContacts = getMutualContacts(getState());
            const contactsToBeSynced = mutualContacts
                .filter(contact => contact.privateChannel.unsyncedCommands.length > 0)
            ;
            if (contactsToBeSynced.length > 0) {
                await dispatch(AsyncActions.syncPrivatePostsWithContacts(contactsToBeSynced));
            }
        };
    },
    syncPrivatePostsWithContactFeeds: (contactFeeds: ContactFeed[]): Thunk => {
        return async (dispatch, getState) => {
            // contactFeeds are usually coming from cached FeedViews
            // so they may contain stale information about the contacts
            // therefore here we need to reselect them from the app state
            const contacts: MutualContact[] = [];
            for (const contactFeed of contactFeeds) {
                if (contactFeed.contact != null) {
                    const publicKey = contactFeed.contact.identity.publicKey;
                    const updatedContact = getState().contacts.find(
                        contact => contact.type === 'mutual-contact' &&
                        contact.identity.publicKey === publicKey
                    ) as MutualContact | undefined;
                    if (updatedContact != null) {
                        contacts.push(updatedContact);
                    }
                }
            }
            dispatch(AsyncActions.syncPrivatePostsWithContacts(contacts));
        };
    },
    syncPrivatePostsWithContacts: (contacts: MutualContact[]): Thunk => {
        return async (dispatch, getState) => {
            Debug.log('syncPrivatePostsWithContacts', {contacts});
            const identity = getState().author.identity!;
            const feedAddress = Swarm.makeFeedAddressFromPublicIdentity(identity);
            const signDigest = (digest: number[]) => Swarm.signDigest(digest, identity);
            const swarmApi = Swarm.makeApi(
                feedAddress,
                signDigest,
                getState().settings.swarmGatewayAddress
            );
            const storage = new SwarmStorage(swarmApi);
            const crypto: Crypto = {
                ...makeNaclEncryption(),
                signDigest,
                deriveSharedKey: (publicKey: HexString) => deriveSharedKey(identity, {publicKey, address: ''}),
                random: (length: number) => generateSecureRandom(length),
            };
            const modelHelper = new ReactNativeModelHelper(getState().settings.swarmGatewayAddress);
            const imageResizer = {
                resizeImage: resizeImageIfNeeded,
                resizeImageForPlaceholder,
            };
            const uploadImage = (image: ImageData) => {
                return swarmStorageUploadImage(swarmApi.bzz, image, imageResizer, modelHelper.getLocalPath);
            };
            const actions = [];
            for (const contact of contacts) {
                const privateChannelUpdate = await syncPrivateChannelWithContact(
                    contact,
                    identity.address as HexString,
                    storage,
                    crypto,
                    uploadImage,
                );
                Debug.log('syncPrivatePostsWithContacts', {privateChannelUpdate});
                const topic = privateChannelUpdate.topic;
                const author = {
                    name: contact.name,
                    image: contact.image,
                    uri: makeBzzFeedUrlFromIdentity(contact.identity),
                };
                const updatedPrivateChannel = applyPrivateChannelUpdate(
                    privateChannelUpdate,
                    (command: PrivateChannelCommand) => {
                        switch (command.type) {
                            case 'post': {
                                const post = {
                                    ...command.post,
                                    topic,
                                    author,
                                    _id: command.post._id || makePostId(command.post),
                                };
                                actions.push(Actions.addPrivatePost(topic, post));
                                return;
                            }
                            case 'remove': {
                                actions.push(Actions.removePrivatePost(topic, command.id));
                                return;
                            }
                        }
                    },
                    (command: PrivateChannelCommand) => {
                        switch (command.type) {
                            case 'post': {
                                actions.push(Actions.updatePrivatePostImages(topic, command.post._id, command.post.images));
                                return;
                            }
                        }
                    }
                );
                actions.push(Actions.updateContactPrivateChannel(contact, updatedPrivateChannel));
            }
            actions.map(action => dispatch(action));
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
            dispatch(Actions.deletePost(post));
            if (post.topic != null && typeof(post._id) === 'string') {
                Debug.log('removePost', {post});
                const postId = post._id as HexString;
                dispatch(Actions.removePrivatePost(post.topic, postId));
                for (const contact of getState().contacts) {
                    if (contact.type === 'mutual-contact') {
                        const topic = calculatePrivateTopic(deriveSharedKey(getState().author.identity!, contact.identity));
                        if (topic === post.topic) {
                            const updatedPrivateChannel = privateChannelRemovePost(contact.privateChannel, postId);
                            dispatch(Actions.updateContactPrivateChannel(contact, updatedPrivateChannel));
                            dispatch(AsyncActions.syncPrivatePostsWithContacts([contact]));
                            return;
                        }
                    }
                }
            }
        };
    },
    shareWithContactFeeds: (originalPost: Post, contactFeeds: ContactFeed[]): Thunk => {
        return async (dispatch, getState) => {
            Debug.log('shareWithContactFeeds', originalPost);
            const { author } = getState();
            const identity = author.identity!;
            const postWithLinkMetaData = await createPostWithLinkMetaData(originalPost);
            const postWithoutId = {
                ...postWithLinkMetaData,
                author,
            };
            const postId = makePostId(postWithoutId);
            for (const contactFeed of contactFeeds) {
                if (contactFeed.contact != null) {
                    const privateChannel = contactFeed.contact.privateChannel;
                    const sharedSecret = deriveSharedKey(identity, contactFeed.contact.identity);
                    const topic = calculatePrivateTopic(sharedSecret);
                    const post = originalPost._id == null || originalPost.topic != null
                        ? copyPostPrivately(postWithLinkMetaData, author, postId, topic)
                        : {
                            ...copyPostWithReferences(postWithLinkMetaData, author, postId, topic),
                            topic,
                            author,
                            _id: postId,
                        }
                    ;

                    const privateChannelWithPost = privateChannelAddPost(privateChannel, post);
                    dispatch(Actions.addPrivatePost(post.topic, post));
                    dispatch(Actions.updateContactPrivateChannel(contactFeed.contact, privateChannelWithPost));
                }
            }
            dispatch(AsyncActions.syncPrivatePostsWithContactFeeds(contactFeeds));
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
            const newPost = copyPostWithReferences(post, author, id, undefined);

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
                autoShare: false,
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

            const identity = getState().author.identity!;
            const localFeedToSync = {
                ...localFeed,
                authorImage: getState().author.image,
                name: getState().author.name,
                publicKey: localFeed.autoShare ? identity.publicKey : undefined,
                isSyncing: true,
            };
            dispatch(Actions.updateOwnFeed({
                ...localFeedToSync,
            }));

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
    createUser: (name: string, image: ImageData, identity?: PrivateIdentity): Thunk => {
        return async (dispatch) => {
            await dispatch(AsyncActions.chainActions([
                AsyncActions.updateProfileName(name),
                AsyncActions.updateProfileImage(image),
                AsyncActions.createUserIdentity(identity),
                AsyncActions.createOwnFeed(),
                AsyncActions.generateInvitedContact(),
            ]));
        };
    },
    createUserIdentity: (identity?: PrivateIdentity): Thunk => {
        return async (dispatch) => {
            const privateIdentity = identity != null
                ? identity
                : await Swarm.generateSecureIdentity(generateSecureRandom)
            ;
            dispatch(InternalActions.updateAuthorIdentity(privateIdentity));
        };
    },
    restoreAppStateFromBackup: (appState: AppState): Thunk => {
        return async (dispatch) => {
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
    generateInvitedContact: (): Thunk => {
        return async (dispatch) => {
            const contactRandomHelper = createSwarmContactRandomHelper(generateSecureRandom);
            const createdAt = Date.now();
            const invitedContact = await createInvitedContact(contactRandomHelper, createdAt);
            dispatch(Actions.addContact(invitedContact));
        };
    },
    advanceContacts: (): Thunk => {
        return async (dispatch, getState) => {
            const contactHelper = getSwarmContactHelper(getState());
            const contacts = getNonMutualContacts(getState());
            for (const contact of contacts) {
                dispatch(AsyncActions.advanceContact(contact, contactHelper));
            }
        };
    },
    advanceContact: (contact: NonMutualContact, contactHelper?: ContactHelper): Thunk => {
        return async (dispatch, getState) => {
            const swarmContactHelper = contactHelper != null ? contactHelper : getSwarmContactHelper(getState());
            const updatedContact = await advanceContactState(contact, swarmContactHelper, 20 * SECOND);
            dispatch(Actions.updateContactState(contact, updatedContact));
        };
    },
    removeContactAndAllPosts: (contact: Contact): Thunk => {
        return async (dispatch, getState) => {
            if (contact.type === 'mutual-contact') {
                const sharedKey = deriveSharedKey(getState().author.identity!, contact.identity);
                const topic = calculatePrivateTopic(sharedKey);
                dispatch(Actions.removePrivatePostsWithTopic(topic));
            }
            dispatch(Actions.removeContact(contact));
        };
    },
};

const getSwarmContactHelper = (state: AppState): ContactHelper => {
    const swarmGateway = state.settings.swarmGatewayAddress;
    const author = state.author;
    const profile = {
        name: author.name,
        image: author.image,
        identity: author.identity!,
    };
    const contactHelper = createSwarmContactHelper(
        profile,
        swarmGateway,
        generateSecureRandom,
    );

    return contactHelper;
};

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

const loadSocialPostsAndUpdateFeeds = async (
    swarm: Swarm.ReadableApi,
    feeds: Feed[],
    updateFeeds: (feedUpdates: RecentPostFeedUpdate[]) => void,
): Promise<Post[]> => {
    const isRecentPostFeedByUrl = (feed: Feed): feed is (RecentPostFeed | ContactFeed) => isPostFeedUrl(feed.feedUrl);
    const socialFeeds = feeds.filter(isRecentPostFeedByUrl);
    const recentPostFeedUpdates = await loadRecentPostFeeds(swarm, socialFeeds);
    updateFeeds(recentPostFeedUpdates);
    const updatedFeeds = recentPostFeedUpdates.map(feedUpdate => feedUpdate.updated);
    return await getPostsFromRecentPostFeeds(updatedFeeds);
};

const loadRSSPostsFromFeeds = async (feeds: Feed[]): Promise<Post[]> => {
    const rssFeeds = feeds.filter(feed => !isPostFeedUrl(feed.url));
    return await RSSPostManager.loadPosts(rssFeeds);
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
    const swarmStorage = makeSwarmPostStorage(swarm, swarmHelpers);
    const swarmStorageSyncer = makeSwarmPostStorageSyncer(swarmStorage);
    return swarmStorageSyncer;
};
