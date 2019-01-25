import { connect } from 'react-redux';
import { AppState } from '../reducers/index';
import { AsyncActions, Actions } from '../actions/Actions';
import { StateProps, DispatchProps, DebugScreen } from '../components/DebugScreen';
import { Feed } from '../models/Feed';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
   return {
       navigation: ownProps.navigation,
       appState: state,
   };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
   return {
        onAppStateReset: () => {
            dispatch(Actions.appStateReset());
        },
        onCreateIdentity: () => {
            dispatch(AsyncActions.createUserIdentity());
        },
        onUpdateLocalFavicon: (feed: Feed, localFavicon: string) => {
            dispatch(AsyncActions.updateFeedAvatarPath(feed, localFavicon));
        },
        onTestTimeTickWithoutReducer: () => {
            dispatch(AsyncActions.timeTickWithoutReducer2());
        },
   };
};

export const DebugScreenContainer = connect<StateProps, DispatchProps, {}>(
   mapStateToProps,
   mapDispatchToProps,
)(DebugScreen);
