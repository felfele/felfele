import { connect } from 'react-redux';

import { AppState } from '../reducers';
import { StateProps, DispatchProps, FeedListEditor } from '../components/FeedListEditor';
import { Feed } from '../models/Feed';
import { getFollowedFeeds, getKnownFeeds } from '../selectors/selectors';

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps & DispatchProps => {
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
        onPressFeed: onPressFeed,
        gatewayAddress: state.settings.swarmGatewayAddress,
        title: 'All feeds',
    };
};

const onPressFeed = (navigation: any, feed: Feed) => {
    navigation.navigate('FeedFromList', { feedUrl: feed.feedUrl, name: feed.name });
};

export const FeedListViewerContainer = connect(mapStateToProps)(FeedListEditor);
