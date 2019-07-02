import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { StateProps, FeedInfo } from '../components/FeedInfo';
import { TypedNavigation } from '../helpers/navigation';
import { mapDispatchToProps } from './FeedInfoContainer';
import { Clipboard } from 'react-native';
import { getInviteLinkWithBase64Params } from '../helpers/deepLinking';
import { Debug } from '../Debug';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const base64RandomSeed = ownProps.navigation.getParam<'FeedInfoInviteLink', 'randomSeed'>('randomSeed');
    const base64ContactPublicKey = ownProps.navigation.getParam<'FeedInfoInviteLink', 'contactPublicKey'>('contactPublicKey');
    Debug.log('FeedInfoDeepLinkContainer.mapStateToProps', {base64RandomSeed, base64ContactPublicKey});
    const link = getInviteLinkWithBase64Params(base64RandomSeed, base64ContactPublicKey);
    Clipboard.setString(link);

    const profile = {
        name: state.author.name,
        image: state.author.image,
        identity: state.author.identity!,
    };

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
        profile,
    };
};

export const FeedInfoInviteLinkContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(FeedInfo);
