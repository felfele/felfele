import { Store } from 'redux';
import { AppState } from '../reducers/AppState';
import { Actions } from '../actions/Actions';
import { AsyncActions } from '../actions/asyncActions';
import { BackgroundTaskActions } from '../actions/backgroundTaskActions';

export const felfeleInitAppActions = (store: Store<AppState, Actions>) => {
    // tslint:disable-next-line:no-console
    console.log('initStore: ', store.getState());

    // @ts-ignore
    store.dispatch(AsyncActions.cleanupContentFilters());
    store.dispatch(Actions.cleanFeedsFromOwnFeeds(store.getState().ownFeeds.map(feed => feed.feedUrl)));
    for (const ownFeed of store.getState().ownFeeds) {
        store.dispatch(Actions.updateOwnFeed({
            ...ownFeed,
            isSyncing: false,
        }));
    }
    // @ts-ignore
    store.dispatch(AsyncActions.cleanUploadingPostState());
    store.dispatch(Actions.timeTick());
    // @ts-ignore
    store.dispatch(BackgroundTaskActions.registerBackgroundTasks());
    // @ts-ignore
    store.dispatch(AsyncActions.downloadFollowedFeedPosts());

    setInterval(() => store.dispatch(Actions.timeTick()), 60000);
};
