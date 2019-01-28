import { connect } from 'react-redux';
import { ApplicationState } from '../models/ApplicationState';
import * as Actions from '../actions/Actions';
import { StateProps, DispatchProps, LogViewer } from '../components/LogViewer';

const mapStateToProps = (state: ApplicationState, ownProps): StateProps => {
    return {
        currentTimestamp: state.currentTimestamp,
        navigation: ownProps.navigation,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
        onTickTime: () => {
            dispatch(Actions.Actions.timeTick());
        },
    };
};

export const LogViewerContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(LogViewer);
