import { connect } from 'react-redux';

import { AppState } from '../reducers';
import { StateProps, DispatchProps, FeedListEditor } from '../components/FeedListEditor';
import { Feed } from '../models/Feed';
import { getFollowedFeeds, getKnownFeeds } from '../selectors/selectors';

const favoriteCompare = (a: Feed, b: Feed): number => (b.favorite === true ? 1 : 0) - (a.favorite === true ? 1 : 0);

const followedCompare = (a: Feed, b: Feed): number => (b.followed === true ? 1 : 0) - (a.followed === true ? 1 : 0);

export const sortFeeds = (feeds: Feed[]): Feed[] => feeds.sort((a, b) => favoriteCompare(a, b) || followedCompare (a, b) || a.name.localeCompare(b.name));

const mapStateToProps = (state: AppState, ownProps: { navigation: any, showExplore: boolean }): StateProps => {
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
        showExplore: ownProps.navigation.state.params.showExplore,
    };
};

export const mapDispatchToProps = (dispatch: any, ownProps: { navigation: any }): DispatchProps => {
    return {
        openExplore: () => {
            ownProps.navigation.navigate('CategoriesContainer');
        },
        onPressFeed: (navigation: any, feed: Feed) => {
            navigation.navigate('FeedFromList', { feedUrl: feed.feedUrl, name: feed.name });
        },
    };
};

export const FeedListViewerContainer = connect(mapStateToProps, mapDispatchToProps)(FeedListEditor);
