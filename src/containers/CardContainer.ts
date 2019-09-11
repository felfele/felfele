import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { StateProps, DispatchProps, MemoizedCard, AuthorFeed } from '../components/Card';
import { Post } from '../models/Post';
import { Feed } from '../models/Feed';
import { AsyncActions } from '../actions/asyncActions';
import { ModelHelper } from '../models/ModelHelper';
import { TypedNavigation } from '../helpers/navigation';
import { getAllFeeds, getContactFeeds } from '../selectors/selectors';
import { ContactFeed } from '../models/ContactFeed';
import { isChildrenPostUploading } from '../helpers/postHelpers';
import { Debug } from '../Debug';

interface OwnProps {
    isSelected: boolean;
    post: Post;
    modelHelper: ModelHelper;
    togglePostSelection: (post: Post) => void;
    navigation: TypedNavigation;
}

const getOriginalAuthorFeed = (post: Post, state: AppState): AuthorFeed | undefined => {
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

const getAuthorFeedOrUndefined = (
    feed: ContactFeed | undefined
) => {
    return feed != null
        ? {
            ...feed,
            isKnownFeed: true,
        }
        : undefined
    ;
};

const getAuthorFeed = (post: Post, state: AppState): AuthorFeed | undefined => {
    if (post.author == null) {
        return;
    }
    const postAuthor = post.author;
    const authorFeed = getAuthorFeedOrUndefined(
            state.feeds.find(feed => feed.feedUrl === postAuthor.uri),
        ) ||
        getAuthorFeedOrUndefined(
            state.ownFeeds.find(feed => feed.name === postAuthor.name),
        ) ||
        getAuthorFeedOrUndefined(
            getContactFeeds(state).find(feed => feed.feedUrl === postAuthor.uri),
        )
    ;

    return authorFeed;
};

const mapStateToProps = (state: AppState, ownProps: OwnProps): StateProps => {
    const authorFeed = getAuthorFeed(ownProps.post, state);
    const originalAuthorFeed = getOriginalAuthorFeed(ownProps.post, state);
    const isUploading = ownProps.post.isUploading === true || isChildrenPostUploading(ownProps.post, state.localPosts);
    return {
        post: {
            ...ownProps.post,
            isUploading,
        },
        currentTimestamp: state.currentTimestamp,
        isSelected: ownProps.isSelected,
        author: state.author,
        modelHelper: ownProps.modelHelper,
        togglePostSelection: ownProps.togglePostSelection,
        navigation: ownProps.navigation,
        authorFeed,
        originalAuthorFeed,
    };
};

const mapDispatchToProps = (dispatch: any, ownProps: { navigation: TypedNavigation }): DispatchProps => {
    return {
        onDeletePost: (post: Post) => {
            dispatch(AsyncActions.removePost(post));
        },
        onSharePost: (post: Post) => {
            // dispatch(AsyncActions.sharePost(post));
            Debug.log('onSharePost', post);
            ownProps.navigation.navigate('ShareWithContainer', {
                post,
                selectedFeeds: [],
            });
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
