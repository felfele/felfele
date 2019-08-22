import { connect } from 'react-redux';
import { AppState } from '../../../reducers/AppState';
import { StateProps, DispatchProps, ContactView } from './ContactView';
import { TypedNavigation } from '../../../helpers/navigation';
import { Feed } from '../../../models/Feed';
import { Contact, MutualContact } from '../../../models/Contact';
import { Debug } from '../../../Debug';
import { getFeedPosts } from '../../../selectors/selectors';
import { AsyncActions } from '../../../actions/asyncActions';
import { findContactByPublicKey, UnknownContact } from '../../../helpers/contactHelpers';
import { Actions } from '../../../actions/Actions';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const publicKey = ownProps.navigation.getParam<'ContactView', 'publicKey'>('publicKey');
    const feed = ownProps.navigation.getParam<'ContactView', 'feed'>('feed');
    const unknownContact: UnknownContact = { type: 'unknown-contact' };
    const contact = findContactByPublicKey(publicKey, state.contacts) || unknownContact;
    const posts = contact.type !== 'mutual-contact'
        ? []
        : getFeedPosts(state, feed.feedUrl)
    ;
    const profile = {
        name: state.author.name,
        image: state.author.image,
        identity: state.author.identity!,
    };

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
            dispatch(Actions.confirmContact(contact));
        },
        onRemoveContact: (contact: Contact) => {
            dispatch(Actions.removeContact(contact));
            ownProps.navigation.popToTop();
        },
        onRefreshPosts: (feeds: Feed[]) => {
            dispatch(AsyncActions.downloadPostsFromFeeds(feeds));
        },
    };
};

export const ContactViewContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(ContactView);
