import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { StateProps, DispatchProps } from '../components/FavoritesFeedView';
import { AsyncActions } from '../actions/Actions';
import { Feed } from '../models/Feed';
import { FavoritesFeedView } from '../components/FavoritesFeedView';
import { getFavoriteFeedsPosts, getFavoriteFeeds } from '../selectors/selectors';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    const posts = getFavoriteFeedsPosts(state);
    const favoriteFeeds = getFavoriteFeeds(state);

    return {
        navigation: ownProps.navigation,
        posts: posts,
        feeds: favoriteFeeds,
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

export const FavoritesContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(FavoritesFeedView);
