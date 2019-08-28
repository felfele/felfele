import { connect } from 'react-redux';

import { AppState } from '../../../reducers/AppState';
import { StateProps, DispatchProps, ShareWithScreen, FeedSection } from './ShareWithScreen';
import { TypedNavigation } from '../../../helpers/navigation';
import { sortFeedsByName } from '../../../helpers/feedHelpers';
import { ContactFeed } from '../../../models/ContactFeed';
import { getContactFeeds } from '../../../selectors/selectors';
import { AsyncActions } from '../../../actions/asyncActions';
import { Post } from '../../../models/Post';
import { Debug } from '../../../Debug';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation, showExplore: boolean }): StateProps => {
    const selectedContacts = ownProps.navigation.getParam<'ShareWithContainer', 'contacts'>('contacts');
    const post = ownProps.navigation.getParam<'ShareWithContainer', 'post'>('post');
    const mutualContactFeeds = getContactFeeds(state);

    const sections: FeedSection[] = [{
        data: sortFeedsByName(mutualContactFeeds),
    }];

    return {
        sections,
        post,
        navigation: ownProps.navigation,
        gatewayAddress: state.settings.swarmGatewayAddress,
    };
};

export const mapDispatchToProps = (dispatch: any, ownProps: { navigation: TypedNavigation }): DispatchProps => {
    return {
        onShareWithContact: (post: Post, feed: ContactFeed) => {
            if (feed.contact != null) {
                Debug.log('ShareWithContainer.mapDispatchToProps.onShareWithContact', {post, feed});

                // TODO
                // dispatch(AsyncActions.shareWithContact(post, feed.contact));
                dispatch(AsyncActions.downloadPrivatePostsFromContacts([feed]));
            }
        },
        onDoneSharing: () => {
            ownProps.navigation.popToTop();
        },
    };
};

export const ShareWithContainer = connect(mapStateToProps, mapDispatchToProps)(ShareWithScreen);
