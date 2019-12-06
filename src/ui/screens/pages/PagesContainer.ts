import { connect } from 'react-redux';

import { AppState } from '../../../reducers/AppState';
import { StateProps, DispatchProps, PagesView } from './PagesView';
import { Feed } from '../../../models/Feed';
import { TypedNavigation } from '../../../helpers/navigation';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation, showExplore: boolean }): StateProps => {
    return {
        navigation: ownProps.navigation,
        gatewayAddress: state.settings.swarmGatewayAddress,
        title: 'PAGES',
        sections: [{
            data: [
                {
                    name: 'Komondor',
                    url: '',
                    feedUrl: '',
                    favicon: '',
                },
                {
                    name: 'Page title',
                    url: '',
                    feedUrl: '',
                    favicon: '',
                },
                {
                    name: 'Page title',
                    url: '',
                    feedUrl: '',
                    favicon: '',
                },
                {
                    name: 'Page title',
                    url: '',
                    feedUrl: '',
                    favicon: '',
                },
                {
                    name: 'Page title',
                    url: '',
                    feedUrl: '',
                    favicon: '',
                },
                {
                    name: 'Page title',
                    url: '',
                    feedUrl: '',
                    favicon: '',
                },
            ],
        }],
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

export const PagesContainer = connect(mapStateToProps, mapDispatchToProps)(PagesView);
