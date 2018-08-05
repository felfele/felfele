import { connect } from 'react-redux';

import { AppState } from '../reducers';
import { StateProps, DispatchProps, FeedListEditor } from '../components/FeedListEditor';
import * as Actions from '../actions/actions';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    return {
        feeds: state.feeds.toArray(),
        navigation: ownProps.navigation,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
    };
};

export const FeedListEditorContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(FeedListEditor);
