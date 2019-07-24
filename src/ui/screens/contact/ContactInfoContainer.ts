import { connect } from 'react-redux';
import { AppState } from '../../../reducers/AppState';
import { Actions } from '../../../actions/Actions';
import { StateProps, DispatchProps, ContactInfo } from './ContactInfo';
import { TypedNavigation } from '../../../helpers/navigation';
import { MutualContact, Contact } from '../../../models/Contact';
import { findContactByPublicKey, UnknownContact } from '../../../helpers/contactHelpers';

const mapStateToProps = (state: AppState, ownProps: {navigation: TypedNavigation}): StateProps => {
    const publicKey = ownProps.navigation.getParam<'ContactInfo', 'publicKey'>('publicKey');
    const unknownContact: UnknownContact = { type: 'unknown-contact' };
    const contact = findContactByPublicKey(publicKey, state.contacts) || unknownContact;
    const profile = {
        name: state.author.name,
        image: state.author.image,
        identity: state.author.identity!,
    };
    return {
        contact,
        navigation: ownProps.navigation,
        profile,
        gatewayAddress: state.settings.swarmGatewayAddress,
    };
};

const mapDispatchToProps = (dispatch: any, ownProps: {navigation: TypedNavigation}): DispatchProps => {
    return {
        onConfirmContact: (contact: MutualContact) => {
            dispatch(Actions.confirmContact(contact));
        },
        onRemoveContact: (contact: Contact) => {
            dispatch(Actions.removeContact(contact));
            ownProps.navigation.popToTop();
        },
    };
};

export const ContactInfoContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(ContactInfo);
