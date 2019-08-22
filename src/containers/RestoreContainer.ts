import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { AsyncActions } from '../actions/asyncActions';
import { StateProps, DispatchProps, Restore } from '../components/Restore';
import { TypedNavigation } from '../helpers/navigation';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    return {
        navigation: ownProps.navigation,
        swarmGatewayAddress: state.settings.swarmGatewayAddress,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onRestoreData: (appState: AppState) => {
            dispatch(AsyncActions.restoreAppStateFromBackup(appState));
        },
    };
};

export const RestoreContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(Restore);
