import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { StateProps, DispatchProps, MemoizedCard, OriginalAuthorFeed } from '../components/Card';
import { Post } from '../models/Post';
import { Feed } from '../models/Feed';
import { AsyncActions } from '../actions/Actions';
import { ModelHelper } from '../models/ModelHelper';
import { TypedNavigation } from '../helpers/navigation';
import { getAllFeeds } from '../selectors/selectors';

interface OwnProps {
    isSelected: boolean;
    post: Post;
    modelHelper: ModelHelper;
    togglePostSelection: (post: Post) => void;
    navigation: TypedNavigation;
}

const getOriginalAuthorFeed = (post: Post, state: AppState): OriginalAuthorFeed | undefined => {
    if (post.references == null) {
        return;
    }
    const originalAuthor = post.references.originalAuthor;
    const knownFeed = getAllFeeds(state).find(feed => originalAuthor != null && feed.feedUrl === originalAuthor.uri);
    return knownFeed != null
        ? {
            ...knownFeed,
            isKnownFeed: true,
        }
        : {
            name: originalAuthor.name,
            feedUrl: originalAuthor.uri,
            url: originalAuthor.uri,
            favicon: originalAuthor.image.uri || '',
            isKnownFeed: false,
        }
    ;
};

const mapStateToProps = (state: AppState, ownProps: OwnProps): StateProps => {
    const originalAuthorFeed = getOriginalAuthorFeed(ownProps.post, state);
    return {
        post: ownProps.post,
        currentTimestamp: state.currentTimestamp,
        isSelected: ownProps.isSelected,
        showSquareImages: state.settings.showSquareImages,
        author: state.author,
        modelHelper: ownProps.modelHelper,
        togglePostSelection: ownProps.togglePostSelection,
        navigation: ownProps.navigation,
        originalAuthorFeed,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onDeletePost: (post: Post) => {
            dispatch(AsyncActions.removePost(post));
        },
        onSharePost: (post: Post) => {
            dispatch(AsyncActions.sharePost(post));
        },
        onDownloadFeedPosts: (feed: Feed) => {
            dispatch(AsyncActions.downloadPostsFromFeeds([feed]));
        },
    };
};

export const CardContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(MemoizedCard);
