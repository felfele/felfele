import { connect } from 'react-redux';
import { AppState } from '../reducers/index';
import * as Actions from '../actions/Actions';
import { StateProps, DispatchProps, YourFeed } from '../components/YourFeed';
import { RSSPostManager } from '../RSSPostManager';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    RSSPostManager.feedManager.setFeeds(state.feeds.toArray());
    return {
        navigation: ownProps.navigation,
        post: null,
        postManager: RSSPostManager,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
    };
};

export const NewsFeedContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps
)(YourFeed);
