import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { Actions } from '../actions/Actions';
import { StateProps, DispatchProps, DebugScreen } from '../components/DebugScreen';
import { TypedNavigation } from '../helpers/navigation';
import { AsyncActions } from '../actions/asyncActions';
import { Feed } from '../models/Feed';
import { Post, PrivatePost } from '../models/Post';
import { emptyPostCommandLog } from '../social/api';
import { MutualContact } from '../models/Contact';
import { HexString } from '../helpers/opaqueTypes';

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
        onAddContact: (contact: MutualContact) => {
            dispatch(AsyncActions.addContact(contact));
        },
        onAddPrivatePost: (topic: HexString, post: PrivatePost) => {
            dispatch(Actions.addPrivatePost(topic, post));
        },
   };
};

export const DebugScreenContainer = connect(
   mapStateToProps,
   mapDispatchToProps,
)(DebugScreen);
