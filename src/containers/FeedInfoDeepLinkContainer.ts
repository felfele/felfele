import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { StateProps, FeedInfo } from '../components/FeedInfo';
import { TypedNavigation } from '../helpers/navigation';
import { mapDispatchToProps } from './FeedInfoContainer';
import { Clipboard } from 'react-native';
// @ts-ignore
import * as base64 from 'base-64';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const base64FeedUrl = ownProps.navigation.getParam<'FeedInfoDeepLink', 'feedUrl'>('feedUrl');
    const feedUrl = base64.decode(base64FeedUrl);
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
        identity: state.author.identity!,
    };
};

export const FeedInfoDeepLinkContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(FeedInfo);
