import { connect } from 'react-redux';
import { ApplicationState } from '../models/ApplicationState';
import * as Actions from '../actions/Actions';
import { StateProps, DispatchProps, Backup } from '../components/Backup';

const mapStateToProps = (state: ApplicationState, ownProps): StateProps => {
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
