import { connect } from 'react-redux';

import { AppState } from '../reducers';
import { StateProps, DispatchProps, FeedListEditor } from '../components/FeedListEditor';
import { Feed } from '../models/Feed';
import { getFollowedFeeds, getKnownFeeds } from '../selectors/selectors';
import { Actions } from '../actions/Actions';

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    // TODO: update favicons?
    const ownFeeds = ownProps.navigation.state.params && ownProps.navigation.state.params.feeds
        ? []
        : state.ownFeeds
    ;
    const followedFeeds = ownProps.navigation.state.params && ownProps.navigation.state.params.feeds
        ? ownProps.navigation.state.params.feeds
        : getFollowedFeeds(state)
    ;
    const knownFeeds = ownProps.navigation.state.params && ownProps.navigation.state.params.feeds
        ? []
        : getKnownFeeds(state)
    ;
    return {
        ownFeeds: ownFeeds,
        followedFeeds: followedFeeds,
        knownFeeds: knownFeeds,
        navigation: ownProps.navigation,
        gatewayAddress: state.settings.swarmGatewayAddress,
        title: 'All feeds',
    };
};

export const mapDispatchToProps = (dispatch: any, ownProps: { navigation: any }): DispatchProps => {
    return {
        openExplore: () => {
            dispatch(Actions.initExplore());
            ownProps.navigation.navigate('CategoriesContainer');
        },
        onPressFeed: (navigation: any, feed: Feed) => {
            navigation.navigate('FeedFromList', { feedUrl: feed.feedUrl, name: feed.name });
        },
    };
};

export const FeedListViewerContainer = connect(mapStateToProps, mapDispatchToProps)(FeedListEditor);
