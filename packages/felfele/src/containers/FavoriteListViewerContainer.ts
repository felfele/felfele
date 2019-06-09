import { connect } from 'react-redux';

import { AppState } from '../reducers/AppState';
import { StateProps, DispatchProps, FeedListEditor, FeedSection } from '../components/FeedListEditor';
import { Feed } from '../models/Feed';
import { TypedNavigation } from '../helpers/navigation';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation, showExplore: boolean }): StateProps => {
    const navParamFeeds = ownProps.navigation.getParam<'FavoriteListViewerContainer', 'feeds'>('feeds');

    const sections: FeedSection[] = [{
        data: navParamFeeds,
    }];

    return {
        sections,
        navigation: ownProps.navigation,
        gatewayAddress: state.settings.swarmGatewayAddress,
        title: 'Favorite channels',
        showExplore: false,
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

export const FavoriteListViewerContainer = connect(mapStateToProps, mapDispatchToProps)(FeedListEditor);
