import { connect } from 'react-redux';
import { AppState } from '../reducers/index';
import * as Actions from '../actions/Actions';
import { StateProps, DispatchProps, LogViewer } from '../components/LogViewer';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
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
