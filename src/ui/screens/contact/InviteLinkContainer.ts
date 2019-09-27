import { connect } from 'react-redux';
import { AppState } from '../../../reducers/AppState';
import { TypedNavigation } from '../../../helpers/navigation';
import { Clipboard } from 'react-native';
import { getInviteLinkWithBase64Params } from '../../../helpers/deepLinking';
import { Debug } from '../../../Debug';
import { FeedLinkReader, StateProps } from '../feed-link-reader/FeedLinkReader';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const link = getLinkWithProfileName(ownProps.navigation);
    Clipboard.setString(link);

    return {
        navigation: ownProps.navigation,
    };
};

const getLinkWithProfileName = (navigation: TypedNavigation): string => {
    const base64RandomSeed = navigation.getParam<'InviteLinkWithProfileName', 'randomSeed'>('randomSeed');
    const base64ContactPublicKey = navigation.getParam<'InviteLinkWithProfileName', 'contactPublicKey'>('contactPublicKey');
    const urlEncodedProfileName = navigation.getParam<'InviteLinkWithProfileName', 'profileName'>('profileName');
    const expiry = navigation.getParam<'InviteLinkWithProfileName', 'expiry'>('expiry');
    Debug.log('InviteLinkContainer.getLinkWithProfileName', {
        base64RandomSeed,
        base64ContactPublicKey,
        profileName: urlEncodedProfileName,
        expiry,
    });
    return getInviteLinkWithBase64Params(base64RandomSeed, base64ContactPublicKey, urlEncodedProfileName, expiry);
};

export const InviteLinkContainer = connect(mapStateToProps)(FeedLinkReader);
