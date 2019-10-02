import { connect } from 'react-redux';
import { AppState } from '../../../reducers/AppState';
import { TypedNavigation } from '../../../helpers/navigation';
import { Clipboard } from 'react-native';
import { getInviteLinkWithParams } from '../../../helpers/deepLinking';
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
    const params = navigation.getParam<'InviteLink', 'params'>('params');
    Debug.log('InviteLinkContainer.getLinkWithProfileName', { params });
    return getInviteLinkWithParams(params);
};

export const InviteLinkContainer = connect(mapStateToProps)(FeedLinkReader);
