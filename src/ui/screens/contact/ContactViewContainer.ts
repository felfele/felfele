import { connect } from 'react-redux';
import { AppState } from '../../../reducers/AppState';
import * as Actions from '../../../actions/Actions';
import { StateProps, DispatchProps, ContactView, UnknownContact } from './ContactView';
import { TypedNavigation } from '../../../helpers/navigation';
import { Feed } from '../../../models/Feed';
import { Contact, MutualContact } from '../../../models/Contact';
import { Debug } from '../../../Debug';
import { getFeedPosts } from '../../../selectors/selectors';

const findContactByPublicKey = (publicKey: string, contacts: Contact[]): Contact | UnknownContact => {
    return contacts.find(
        c => c.type === 'mutual-contact' &&
        c.identity.publicKey === publicKey
    )
    ||
    {
        type: 'unknown-contact',
    };
};

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const publicKey = ownProps.navigation.getParam<'ContactView', 'publicKey'>('publicKey');
    const feed = ownProps.navigation.getParam<'ContactView', 'feed'>('feed');
    const contact = findContactByPublicKey(publicKey, state.contacts);
    const posts = contact.type !== 'mutual-contact'
        ? []
        : getFeedPosts(state, feed.feedUrl)
    ;
    Debug.log('ContactViewContainer.mapStateToProps', {feed, contact, posts});
    return {
        navigation: ownProps.navigation,
        onBack: () => ownProps.navigation.popToTop(),
        posts,
        feed,
        contact,
        gatewayAddress: state.settings.swarmGatewayAddress,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onConfirmContact: (contact: MutualContact) => {

        },
        onRemoveContact: (contact: Contact) => {

        },
        onRefreshPosts: (feeds: Feed[]) => {
            dispatch(Actions.AsyncActions.downloadPostsFromFeeds(feeds));
        },
    };
};

export const ContactViewContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(ContactView);
