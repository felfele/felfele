import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { AsyncActions, Actions } from '../actions/Actions';
import { StateProps, DispatchProps, DebugScreen } from '../components/DebugScreen';
import { Post } from '../models/Post';
import { TypedNavigation } from '../helpers/navigation';

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
            dispatch(Actions.deleteContacts());
        },
   };
};

export const DebugScreenContainer = connect(
   mapStateToProps,
   mapDispatchToProps,
)(DebugScreen);
