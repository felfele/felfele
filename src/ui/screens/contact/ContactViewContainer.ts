import { connect } from 'react-redux';
import { AppState } from '../../../reducers/AppState';
import { StateProps, DispatchProps, ContactView } from './ContactView';
import { TypedNavigation } from '../../../helpers/navigation';
import { Feed } from '../../../models/Feed';
import { Contact, MutualContact } from '../../../models/Contact';
import { Debug } from '../../../Debug';
import { getPrivateChannelPosts, getContactFeeds, getPrivateChannelFeeds } from '../../../selectors/selectors';
import { AsyncActions } from '../../../actions/asyncActions';
import { findContactByPublicKey, UnknownContact, deriveSharedKey } from '../../../helpers/contactHelpers';
import { Actions } from '../../../actions/Actions';
import { Post } from '../../../models/Post';
import { calculatePrivateTopic } from '../../../protocols/privateSharing';

const getContactPosts = (state: AppState, contact: MutualContact) => {
    const topic = calculatePrivateTopic(deriveSharedKey(state.author.identity!, contact.identity));
    return getPrivateChannelPosts(state, topic);
};

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const publicKey = ownProps.navigation.getParam<'ContactView', 'publicKey'>('publicKey');
    const unknownContact: UnknownContact = { type: 'unknown-contact' };
    const emptyFeed: Feed = {
        name: '',
        url: '',
        feedUrl: '',
        favicon: '',
    };
    const contactFeed = getPrivateChannelFeeds(state).find(f => f.contact != null && f.contact.identity.publicKey === publicKey);
    const contact = contactFeed != null && contactFeed.contact != null
        ? contactFeed.contact
        : unknownContact
    ;
    const posts = contact.type === 'unknown-contact'
        ? []
        : getContactPosts(state, contact)
    ;
    const profile = {
        name: state.author.name,
        image: state.author.image,
        identity: state.author.identity!,
    };
    const feed = contactFeed || emptyFeed;

    Debug.log('ContactViewContainer.mapStateToProps', {feed, contact, posts});
    return {
        navigation: ownProps.navigation,
        onBack: () => ownProps.navigation.popToTop(),
        posts,
        feed,
        contact,
        gatewayAddress: state.settings.swarmGatewayAddress,
        profile,
    };
};

const mapDispatchToProps = (dispatch: any, ownProps: { navigation: TypedNavigation }): DispatchProps => {
    return {
        onConfirmContact: (contact: MutualContact) => {
        },
        onRemoveContact: (contact: Contact) => {
            dispatch(AsyncActions.removeContactAndAllPosts(contact));
            ownProps.navigation.popToTop();
        },
        onRefreshPosts: (feeds: Feed[]) => {
            dispatch(AsyncActions.syncPrivatePostsWithContactFeeds(feeds));
        },
        onSaveDraft: (draft: Post) => {
            dispatch(Actions.addDraft(draft));
        },
    };
};

export const ContactViewContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(ContactView);
