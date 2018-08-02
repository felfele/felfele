import { connect } from 'react-redux';

import { AppState } from '../reducers/index';
import { StateProps, DispatchProps, FeedListEditor } from '../components/FeedListEditor';
import * as Actions from '../actions/Actions';
import { RSSPostManager } from '../RSSPostManager';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    return {
        feeds: state.feeds.toArray(),
        navigation: ownProps.navigation,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
        onPress: (currentScreen: Screen) => {
           // dispatch(Actions.changeScreen(nextScreen));
        },
    };
};

export const FeedListEditorContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps
)(FeedListEditor);
