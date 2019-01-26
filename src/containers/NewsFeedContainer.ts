import { connect } from 'react-redux';
import { ApplicationState } from '../models/ApplicationState';
import { RSSPostManager } from '../RSSPostManager';
import { AsyncActions } from '../actions/Actions';
import { Post } from '../models/Post';
import { Feed } from '../models/Feed';
import { StateProps, DispatchProps, NewsFeedView } from '../components/NewsFeedView';

const isPostFromFollowedFeed = (post: Post, followedFeeds: Feed[]): boolean => {
    return followedFeeds.find(feed => {
        return feed != null && post.author != null &&
            feed.feedUrl === post.author.uri;
    }) != null;
};

const mapStateToProps = (state: ApplicationState, ownProps): StateProps => {
    const followedFeeds = state.feeds.filter(feed => feed != null && feed.followed === true);
    const posts = state.rssPosts
        .filter(post => post != null && isPostFromFollowedFeed(post, followedFeeds));
    const filteredPosts = posts;

    RSSPostManager.setContentFilters(state.contentFilters);

    return {
        navigation: ownProps.navigation,
        posts: filteredPosts,
        feeds: followedFeeds,
        settings: state.settings,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
        onRefreshPosts: (feeds: Feed[]) => {
            dispatch(AsyncActions.downloadPostsFromFeeds(feeds));
        },
    };
};

export const NewsFeedContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(NewsFeedView);
