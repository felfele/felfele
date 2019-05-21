import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { StateProps, FeedInfo } from '../components/FeedInfo';
import { TypedNavigation } from '../helpers/navigation';
import { mapDispatchToProps } from './FeedInfoContainer';
import { Clipboard } from 'react-native';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const feedUrlParam = ownProps.navigation.getParam<'FeedInfoDeepLink', 'feedUrl'>('feedUrl');
    const feedUrl = 'bzz-feed:/?'.concat(feedUrlParam);
    Clipboard.setString(feedUrl);

    return {
        feed: {
            name: '',
            url: '',
            feedUrl: '',
            favicon: '',
        },
        swarmGateway: state.settings.swarmGatewayAddress,
        navigation: ownProps.navigation,
        isKnownFeed: false,
    };
};

export const FeedInfoDeepLinkContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(FeedInfo);
