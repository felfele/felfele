import { connect } from 'react-redux';

import { AppState } from '../../../reducers/AppState';
import { StateProps, DispatchProps, PrivateChannelsListView, FeedSection } from './PrivateChannelsListView';
import { Feed } from '../../../models/Feed';
import { TypedNavigation } from '../../../helpers/navigation';
import { sortFeedsByName } from '../../../helpers/feedHelpers';
import { ContactFeed } from '../../../models/ContactFeed';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation, showExplore: boolean }): StateProps => {
    const contactFeeds = ownProps.navigation.getParam<'PrivateChannelListContainer', 'contactFeeds'>('contactFeeds');

    const sections: FeedSection[] = [{
        title: 'Private channels',
        data: sortFeedsByName(contactFeeds),
    }];

    return {
        sections,
        navigation: ownProps.navigation,
        gatewayAddress: state.settings.swarmGatewayAddress,
    };
};

export const mapDispatchToProps = (dispatch: any, ownProps: { navigation: TypedNavigation }): DispatchProps => {
    return {
        onPressChannel: (feed: ContactFeed) => {
            if (feed.contact != null) {
                ownProps.navigation.navigate('ContactView', {
                    publicKey: feed.contact!.identity.publicKey,
                    feed,
                });
            }
        },
        onAddChannel: () => {
            const feed: Feed = {
                favicon: '',
                feedUrl: '',
                name: '',
                url: '',
            };
            ownProps.navigation.navigate('FeedInfo', { feed: feed });
        },
    };
};

export const PrivateChannelListContainer = connect(mapStateToProps, mapDispatchToProps)(PrivateChannelsListView);
