import { connect } from 'react-redux';
import { AppState } from '../reducers/index';
import * as Actions from '../actions/Actions';
import { StateProps, DispatchProps, LogViewer } from '../components/LogViewer';

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    return {
        currentTimestamp: state.currentTimestamp,
        navigation: ownProps.navigation,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onTickTime: () => {
            dispatch(Actions.Actions.timeTick());
        },
    };
};

export const LogViewerContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(LogViewer);
