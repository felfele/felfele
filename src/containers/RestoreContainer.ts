import { connect } from 'react-redux';
import { ApplicationState } from '../models/ApplicationState';
import * as Actions from '../actions/Actions';
import { StateProps, DispatchProps, Restore } from '../components/Restore';

const mapStateToProps = (state: ApplicationState, ownProps): StateProps => {
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
