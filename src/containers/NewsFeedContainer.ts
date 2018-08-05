import { connect } from 'react-redux';
import { AppState } from '../reducers';
import * as Actions from '../actions/actions';
import { StateProps, DispatchProps, YourFeed } from '../components/YourFeed';
import { RSSPostManager } from '../RSSPostManager';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    RSSPostManager.feedManager.setFeeds(state.feeds.toArray());
    RSSPostManager.setContentFilters(state.contentFilters.toArray());
    return {
        navigation: ownProps.navigation,
        postManager: RSSPostManager,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
    };
};

export const NewsFeedContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(YourFeed);
