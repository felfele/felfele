import { Thunk, Dispatch } from './actionHelpers';
import { FELFELE_FOUNDATION_URL } from '../reducers/defaultData';
import { registerBackgroundTask } from '../helpers/backgroundTask';
import * as Swarm from '../swarm/Swarm';
import { loadRecentPostFeeds, getPostsFromRecentPostFeeds } from '../swarm-social/swarmStorage';
import { mergeUpdatedPosts } from '../helpers/postHelpers';
import { localNotification } from '../helpers/notifications';
import { Post } from '../models/Post';
import { Actions } from './Actions';
import { RecentPostFeed } from '../social/api';
import { AppState } from '../reducers/AppState';
import { getMutualContacts } from '../selectors/selectors';
import { AsyncActions } from './asyncActions';
import { Debug } from '../Debug';

const registerFoundationFeedNotificiations = (intervalMinutes: number, dispatch: Dispatch, getState: () => AppState) => {
    const foundationFeeds = getState().feeds.filter(feed => feed.feedUrl === FELFELE_FOUNDATION_URL);
    if (foundationFeeds.length > 0) {
        const foundationFeed = foundationFeeds[0];
        const getLatestPostCreateTime = (posts: Post[]) => posts.length > 0
            ? posts[0].createdAt
            : 0
        ;
        registerBackgroundTask(intervalMinutes, async () => {
            Debug.log('Background feed check started');
            const previousPosts = getState().rssPosts.filter(post => post.author != null && post.author.uri ===  foundationFeed.feedUrl);
            const previousSortedPosts = previousPosts.sort((a, b) => b.createdAt - a.createdAt);
            const address = Swarm.makeFeedAddressFromBzzFeedUrl(foundationFeeds[0].feedUrl);
            const swarm = Swarm.makeReadableApi(address, getState().settings.swarmGatewayAddress);
            const feedUpdates = await loadRecentPostFeeds(swarm, foundationFeeds as RecentPostFeed[]);
            const updatedFeeds = feedUpdates.map(feedUpdate => feedUpdate.updated);
            const recentPosts = await getPostsFromRecentPostFeeds(updatedFeeds);
            const isFeedUpdated = getLatestPostCreateTime(recentPosts) > getLatestPostCreateTime(previousSortedPosts);
            if (isFeedUpdated) {
                const posts = mergeUpdatedPosts(recentPosts, previousPosts);
                dispatch(Actions.updateRssPosts(posts));
                localNotification('There is a new version available!');
            }
            Debug.log('Background feed check finished', {isFeedUpdated});
        });
    }
};

const registerPrivateChannelSync = (intervalMinutes: number, dispatch: Dispatch, getState: () => AppState) => {
    registerBackgroundTask(intervalMinutes, async () => {
        Debug.log('Background privateChannel sync started');
        const mutualContacts = getMutualContacts(getState());
        const contactsToBeSynced = mutualContacts
            .filter(contact => contact.privateChannel.unsyncedCommands.length > 0)
        ;
        if (contactsToBeSynced.length > 0) {
            await dispatch(AsyncActions.syncPrivatePostsWithContacts(contactsToBeSynced));
        }
        Debug.log('Background privateChannel sync finished', {numSynced: contactsToBeSynced.length});
    });
};

// this is a workaround for not having a dependency on backgroundFetch in the share extension
export const BackgroundTaskActions = {
    registerBackgroundTasks: (): Thunk => {
        return async (dispatch, getState) => {
            registerFoundationFeedNotificiations(12 * 60, dispatch, getState);
            registerPrivateChannelSync(1 * 60, dispatch, getState);
        };
    },
};
