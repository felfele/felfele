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
import { AsyncActions } from './asyncActions';

const registerFoundationFeedNotificiations = (intervalMinutes: number, dispatch: Dispatch, getState: () => AppState) => {
    const foundationFeeds = getState().feeds.filter(feed => feed.feedUrl === FELFELE_FOUNDATION_URL);
    if (foundationFeeds.length > 0) {
        const foundationFeed = foundationFeeds[0];
        const getLatestPostCreateTime = (posts: Post[]) => posts.length > 0
            ? posts[0].createdAt
            : 0
        ;
        registerBackgroundTask('Foundation feed check', intervalMinutes, async () => {
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
                if (previousPosts.length > 0) {
                    localNotification('There is a new version available!');
                }
            }
        });
    }
};

// this is a workaround for not having a dependency on backgroundFetch in the share extension
export const BackgroundTaskActions = {
    registerBackgroundTasks: (): Thunk => {
        return async (dispatch, getState) => {
            registerFoundationFeedNotificiations(12 * 60, dispatch, getState);
            registerBackgroundTask('Private channel sync', 1 * 60, () => dispatch(AsyncActions.syncPrivateChannelWithAllContacts()));
        };
    },
};
