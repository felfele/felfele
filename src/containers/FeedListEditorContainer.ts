import { connect } from 'react-redux';

import { AppState } from '../reducers';
import { StateProps, DispatchProps, FeedListEditor } from '../components/FeedListEditor';
import { getSwarmGatewayUrl } from '../Swarm';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    const feeds = state.feeds.toArray().map(feed => ({
        ...feed,
        favicon: getSwarmGatewayUrl(feed.favicon || ''),
    }));
    return {
        feeds,
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
