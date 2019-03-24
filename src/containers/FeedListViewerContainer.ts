import { connect } from 'react-redux';

import { AppState } from '../reducers/AppState';
import { StateProps, DispatchProps, FeedListEditor } from '../components/FeedListEditor';
import { Feed } from '../models/Feed';
import { getFollowedFeeds, getKnownFeeds } from '../selectors/selectors';
import { TypedNavigation, Routes } from '../helpers/navigation';

const favoriteCompare = (a: Feed, b: Feed): number => (b.favorite === true ? 1 : 0) - (a.favorite === true ? 1 : 0);

const followedCompare = (a: Feed, b: Feed): number => (b.followed === true ? 1 : 0) - (a.followed === true ? 1 : 0);

export const sortFeeds = (feeds: Feed[]): Feed[] => feeds.sort((a, b) => favoriteCompare(a, b) || followedCompare (a, b) || a.name.localeCompare(b.name));

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation, showExplore: boolean }): StateProps => {
    // TODO: update favicons?
    const navParamFeeds = ownProps.navigation.getParam<Routes['FeedListViewerContainer'], 'feeds'>('feeds');
    const navParamShowExplore = ownProps.navigation.getParam<Routes['FeedListViewerContainer'], 'showExplore'>('showExplore');
    const ownFeeds = navParamFeeds
        ? []
        : state.ownFeeds
    ;
    const followedFeeds = navParamFeeds
        ? navParamFeeds
        : getFollowedFeeds(state)
    ;
    const knownFeeds = navParamFeeds
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
        showExplore: navParamShowExplore,
    };
};

export const mapDispatchToProps = (dispatch: any, ownProps: { navigation: TypedNavigation }): DispatchProps => {
    return {
        openExplore: () => {
            ownProps.navigation.navigate<Routes, 'CategoriesContainer'>('CategoriesContainer', {});
        },
        onPressFeed: (feed: Feed) => {
            ownProps.navigation.navigate<Routes, 'FeedFromList'>('FeedFromList', {
                feedUrl: feed.feedUrl,
                name: feed.name,
            });
        },
    };
};

export const FeedListViewerContainer = connect(mapStateToProps, mapDispatchToProps)(FeedListEditor);
