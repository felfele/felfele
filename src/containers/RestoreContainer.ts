import { connect } from 'react-redux';
import { AppState } from '../reducers/index';
import * as Actions from '../actions/Actions';
import { StateProps, DispatchProps, Restore } from '../components/Restore';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    return {
        navigation: ownProps.navigation,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
        onRestoreData: (data: string, secretHex: string) => {
            dispatch(Actions.AsyncActions.restoreFromBackup(data, secretHex));
        },
    };
};

export const RestoreContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(Restore);
