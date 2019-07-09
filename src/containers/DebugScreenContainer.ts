import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { AsyncActions, Actions } from '../actions/Actions';
import { StateProps, DispatchProps, DebugScreen } from '../components/DebugScreen';
import { TypedNavigation } from '../helpers/navigation';
import { Feed } from '../models/Feed';
import { Post } from '../models/Post';
import { emptyPostCommandLog } from '../social/api';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
   return {
       navigation: ownProps.navigation,
       appState: state,
   };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
   return {
        onAppStateReset: () => {
            dispatch(Actions.appStateReset());
        },
        onCreateIdentity: () => {
            dispatch(AsyncActions.createUserIdentity());
        },
        onDeleteContacts: () => {
            dispatch(Actions.deleteAllContacts());
        },
        onDeleteFeeds: () => {
            dispatch(Actions.removeAllFeeds());
        },
        onDeletePosts: () => {
            dispatch(Actions.removeAllPosts());
            dispatch(Actions.updateRssPosts([]));
            dispatch(Actions.updateOwnFeed({
                postCommandLog: emptyPostCommandLog,
                posts: [],
            }));
        },
        onAddFeed: (feed: Feed) => {
            dispatch(AsyncActions.addFeed(feed));
        },
        onRefreshFeeds: (feeds: Feed[]) => {
            dispatch(AsyncActions.downloadPostsFromFeeds(feeds));
        },
        onAddPost: (post: Post) => {
            dispatch(AsyncActions.createPost(post));
        },
   };
};

export const DebugScreenContainer = connect(
   mapStateToProps,
   mapDispatchToProps,
)(DebugScreen);
