import { connect } from 'react-redux';

import { AppState } from '../../../reducers/AppState';
import { StateProps, DispatchProps, PublicChannelsListView, PublicFeedSection } from './PublicChannelsListView';
import { Feed } from '../../../models/Feed';
import { getFollowedFeeds, getKnownFeeds } from '../../../selectors/selectors';
import { TypedNavigation } from '../../../helpers/navigation';
import { sortFeedsByName } from '../../../helpers/feedHelpers';

const addSection = (title: string, feeds: Feed[]): PublicFeedSection[] => {
    if (feeds.length > 0) {
        return [{
            title: `${title} (${feeds.length})`,
            data: feeds,
        }];
    }
    return [];
};

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation, showExplore: boolean }): StateProps => {
    const navParamFeeds = ownProps.navigation.getParam<'PublicChannelsListContainer', 'feeds'>('feeds');
    const navParamShowExplore = ownProps.navigation.getParam<'PublicChannelsListContainer', 'showExplore'>('showExplore');
    const followedFeeds = sortFeedsByName(navParamFeeds
        ? navParamFeeds
        : getFollowedFeeds(state)
    );
    const knownFeeds = sortFeedsByName(navParamFeeds
        ? []
        : getKnownFeeds(state)
    );

    const sections: PublicFeedSection[] = ([] as PublicFeedSection[]).concat(
        addSection('Public channels you follow', followedFeeds),
        addSection('Other channels', knownFeeds),
    );

    return {
        sections,
        navigation: ownProps.navigation,
        gatewayAddress: state.settings.swarmGatewayAddress,
        title: 'All public channels',
        showExplore: navParamShowExplore,
    };
};

export const mapDispatchToProps = (dispatch: any, ownProps: { navigation: TypedNavigation }): DispatchProps => {
    return {
        openExplore: () => {
            ownProps.navigation.navigate('CategoriesContainer', {});
        },
        onPressFeed: (feed: Feed) => {
            ownProps.navigation.navigate('FeedFromList', {
                feedUrl: feed.feedUrl,
                name: feed.name,
            });
        },
    };
};

export const PublicChannelsListContainer = connect(mapStateToProps, mapDispatchToProps)(PublicChannelsListView);
