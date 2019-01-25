import { connect } from 'react-redux';
import { AppState } from '../models/AppState';
import * as Actions from '../actions/Actions';
import { StateProps, DispatchProps, Backup } from '../components/Backup';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    return {
        navigation: ownProps.navigation,
        appState: state,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
    };
};

export const BackupContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(Backup);
