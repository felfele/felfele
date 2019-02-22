import { connect } from 'react-redux';

import { AppState } from '../reducers';
import { StateProps, FeedListViewer } from '../components/FeedListEditor';
import { Feed } from '../models/Feed';
import { getFollowedFeeds, getKnownFeeds, getFavoriteFeeds } from '../selectors/selectors';

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
        onPressFeed: onPressFeed,
    };
};

const onPressFeed = (navigation: any, feed: Feed) => {
    navigation.navigate('FeedFromList', { feedUrl: feed.feedUrl, name: feed.name });
};

export const FeedListViewerContainer = connect(mapStateToProps)(FeedListViewer);
