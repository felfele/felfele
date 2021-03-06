import { connect } from 'react-redux';

import { AppState } from '../../../reducers/AppState';
import { StateProps, DispatchProps, PrivateChannelsListView, FeedSection } from './PrivateChannelsListView';
import { Feed } from '../../../models/Feed';
import { TypedNavigation } from '../../../helpers/navigation';
import { sortFeedsByName, isContactFeed } from '../../../helpers/feedHelpers';
import { ContactFeed } from '../../../models/ContactFeed';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation, showExplore: boolean }): StateProps => {
    const contactFeeds = ownProps.navigation.getParam<'PrivateChannelListContainer', 'contactFeeds'>('contactFeeds');
    const sortedContactFeeds = sortFeedsByName(contactFeeds);

    const sections: FeedSection[] = sortedContactFeeds.length === 0
        ? []
        : [{
            title: 'Private channels',
            data: sortedContactFeeds,
        }, {
            title: 'Your own channel',
            data: state.ownFeeds,
        }]
    ;

    return {
        sections,
        navigation: ownProps.navigation,
        gatewayAddress: state.settings.swarmGatewayAddress,
    };
};

export const mapDispatchToProps = (dispatch: any, ownProps: { navigation: TypedNavigation }): DispatchProps => {
    return {
        onPressChannel: (feed: ContactFeed | Feed) => {
            if (isContactFeed(feed)) {
                ownProps.navigation.navigate('ContactView', {
                    publicKey: feed.contact.identity.publicKey,
                });
            } else {
                ownProps.navigation.navigate('Feed', {
                    feedUrl: feed.feedUrl,
                    name: feed.name,
                });
            }
        },
        onAddChannel: () => {
            ownProps.navigation.navigate('FeedLinkReader', {});
        },
    };
};

export const PrivateChannelListContainer = connect(mapStateToProps, mapDispatchToProps)(PrivateChannelsListView);
