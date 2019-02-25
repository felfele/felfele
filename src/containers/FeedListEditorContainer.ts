import { connect } from 'react-redux';

import { AppState } from '../reducers';
import { StateProps, FeedListEditor, DispatchProps } from '../components/FeedListEditor';
import { Feed } from '../models/Feed';
import { getFollowedFeeds, getKnownFeeds } from '../selectors/selectors';

const favoriteCompare = (a: Feed, b: Feed): number => (b.favorite === true ? 1 : 0) - (a.favorite === true ? 1 : 0);

const followedCompare = (a: Feed, b: Feed): number => (b.followed === true ? 1 : 0) - (a.followed === true ? 1 : 0);

export const sortFeeds = (feeds: Feed[]): Feed[] => feeds.sort((a, b) => favoriteCompare(a, b) || followedCompare (a, b) || a.name.localeCompare(b.name));

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps & DispatchProps => {
    return {
        ownFeeds: state.ownFeeds,
        followedFeeds: getFollowedFeeds(state),
        knownFeeds: getKnownFeeds(state),
        navigation: ownProps.navigation,
        onPressFeed: onPressFeed,
        gatewayAddress: state.settings.swarmGatewayAddress,
    };
};

const onPressFeed = (navigation: any, feed: Feed) => {
    navigation.navigate('FeedInfo', { feed: feed });
};

export const FeedListEditorContainer = connect(mapStateToProps)(FeedListEditor);
