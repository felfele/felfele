import { connect } from 'react-redux';
import { AppState } from '../../../reducers/AppState';
import { StateProps, DispatchProps } from '../FeedLoader';
import { TypedNavigation } from '../../../helpers/navigation';
import { FeedLoader } from '../FeedLoader';
import { createCodeReceivedContact, advanceContactState } from '../../../helpers/contactHelpers';
import { SECOND } from '../../../DateUtils';
import { ContactActions } from '../../../actions/ContactActions';
import { Alert } from 'react-native';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const inviteCode = ownProps.navigation.getParam<'ContactLoader', 'inviteCode'>('inviteCode');
    return {
        title: inviteCode.profileName,
        navigation: ownProps.navigation,
    };
};

export const mapDispatchToProps = (dispatch: any, ownProps: { navigation: TypedNavigation }): DispatchProps => {
    return {
        onLoad: async () => {
            const inviteCode = ownProps.navigation.getParam<'ContactLoader', 'inviteCode'>('inviteCode');
            const swarmContactHelper = ownProps.navigation.getParam<'ContactLoader', 'contactHelper'>('contactHelper');

            const codeReceivedContact = await createCodeReceivedContact(inviteCode.randomSeed, inviteCode.contactPublicKey, swarmContactHelper);
            const updatedContact = await advanceContactState(codeReceivedContact, swarmContactHelper, 20 * SECOND);
            dispatch(ContactActions.addContact(updatedContact));
            if (updatedContact.type === 'mutual-contact') {
                ownProps.navigation.navigate('ContactSuccess', { contact: updatedContact, isReceiver: true });
            } else {
                onInviteContactFailed(ownProps.navigation);
            }
        },
    };
};

const onInviteContactFailed = (navigation: TypedNavigation) => {
    const options: any[] = [
        { text: 'Ok', onPress: () => navigation.popToTop(), style: 'cancel' },
    ];
    const title = 'Your contact is pending confirmation.';
    const message = 'Your private channel will be available when your contact opens the app.';

    Alert.alert(
        title,
        message,
        options,
        { cancelable: true },
    );
};

export const ContactLoaderContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(FeedLoader);
