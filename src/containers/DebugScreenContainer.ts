import { connect } from 'react-redux';
import { AppState } from '../reducers/index';
import { AsyncActions, Actions } from '../actions/Actions';
import { StateProps, DispatchProps, DebugScreen } from '../components/DebugScreen';
import { Post } from '../models/Post';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
   return {
       navigation: ownProps.navigation,
       appState: state,
   };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
   return {
       createPost: (post: Post) => {
           dispatch(AsyncActions.createPost(post));
       },
       onAppStateReset: () => {
           dispatch(Actions.appStateReset());
       },
   };
};

export const DebugScreenContainer = connect<StateProps, DispatchProps, {}>(
   mapStateToProps,
   mapDispatchToProps,
)(DebugScreen);
