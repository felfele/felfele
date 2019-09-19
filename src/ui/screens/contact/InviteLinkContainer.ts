import { connect } from 'react-redux';
import { AppState } from '../../../reducers/AppState';
import { TypedNavigation } from '../../../helpers/navigation';
import { Clipboard } from 'react-native';
import { getInviteLinkWithBase64Params } from '../../../helpers/deepLinking';
import { Debug } from '../../../Debug';
import { FeedLinkReader, StateProps } from '../feed-link-reader/FeedLinkReader';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation, isNameFromLink: boolean }): StateProps => {
    const link = ownProps.isNameFromLink === true
        ? getLinkWithProfileName(ownProps.navigation)
        : getLink(ownProps.navigation);
    Clipboard.setString(link);

    return {
        navigation: ownProps.navigation,
    };
};

const getLink = (navigation: TypedNavigation): string => {
    const base64RandomSeed = navigation.getParam<'InviteLink', 'randomSeed'>('randomSeed');
    const base64ContactPublicKey = navigation.getParam<'InviteLink', 'contactPublicKey'>('contactPublicKey');
    Debug.log('InviteLinkContainer.getLink', {base64RandomSeed, base64ContactPublicKey});
    return getInviteLinkWithBase64Params(base64RandomSeed, base64ContactPublicKey);
};

const getLinkWithProfileName = (navigation: TypedNavigation): string => {
    const base64RandomSeed = navigation.getParam<'InviteLink', 'randomSeed'>('randomSeed');
    const base64ContactPublicKey = navigation.getParam<'InviteLink', 'contactPublicKey'>('contactPublicKey');
    const urlEncodedProfileName = navigation.getParam<'InviteLinkWithProfileName', 'profileName'>('profileName');
    Debug.log('InviteLinkContainer.getLinkWithProfileName', {base64RandomSeed, base64ContactPublicKey, profileName: urlEncodedProfileName});
    return getInviteLinkWithBase64Params(base64RandomSeed, base64ContactPublicKey, urlEncodedProfileName);
};

export const InviteLinkContainer = connect(mapStateToProps)(FeedLinkReader);
