import { connect } from 'react-redux';

import { AppState } from '../../../reducers/AppState';
import { StateProps, DispatchProps, ShareWithScreen, FeedSection } from './ShareWithScreen';
import { TypedNavigation } from '../../../helpers/navigation';
import { sortFeedsByName, isContactFeed } from '../../../helpers/feedHelpers';
import { getContactFeeds } from '../../../selectors/selectors';
import { AsyncActions } from '../../../actions/asyncActions';
import { Post } from '../../../models/Post';
import { Feed } from '../../../models/Feed';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation, showExplore: boolean }): StateProps => {
    const post = ownProps.navigation.getParam<'ShareWithContainer', 'post'>('post');
    const selectedFeeds = ownProps.navigation.getParam<'ShareWithContainer', 'selectedFeeds'>('selectedFeeds');
    const mutualContactFeeds = getContactFeeds(state);
    const postAuthorUri = post.author != null
        ? post.author.uri
        : undefined
    ;
    const contactFeedsWithoutPostAuthor = mutualContactFeeds.filter(feed => feed.feedUrl !== postAuthorUri);

    const sections: FeedSection[] = [{
        data: sortFeedsByName(contactFeedsWithoutPostAuthor),
    }];

    return {
        sections,
        post,
        selectedFeeds,
        navigation: ownProps.navigation,
        gatewayAddress: state.settings.swarmGatewayAddress,
    };
};

const mapDispatchToProps = (dispatch: any, ownProps: { navigation: TypedNavigation }): DispatchProps => {
    return {
        onShareWithContacts: (post: Post, feeds: Feed[]) => {
            const contactFeeds = feeds.filter(isContactFeed);
            dispatch(AsyncActions.shareWithContactFeeds(post, contactFeeds));
        },
        onDoneSharing: (navigateTo?: () => void) => {
            const onDoneSharing = ownProps.navigation.getParam<'ShareWithContainer', 'onDoneSharing'>('onDoneSharing');
            if (onDoneSharing != null) {
                onDoneSharing();
            }
            if (navigateTo != null) {
                navigateTo();
            } else {
                ownProps.navigation.popToTop();
            }
        },
    };
};

export const ShareWithContainer = connect(mapStateToProps, mapDispatchToProps)(ShareWithScreen);
