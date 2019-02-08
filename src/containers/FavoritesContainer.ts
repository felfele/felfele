import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { StateProps, DispatchProps } from '../components/FavoritesFeedView';
import { AsyncActions } from '../actions/Actions';
import { Feed } from '../models/Feed';
import { FavoritesFeedView } from '../components/FavoritesFeedView';
import { getFavoriteFeedsPosts, getFavoriteFeeds } from '../selectors/selectors';

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    const posts = getFavoriteFeedsPosts(state);
    const favoriteFeeds = getFavoriteFeeds(state);

    return {
        navigation: ownProps.navigation,
        posts: posts,
        feeds: favoriteFeeds,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onRefreshPosts: (feeds: Feed[]) => {
            dispatch(AsyncActions.downloadPostsFromFeeds(feeds));
        },
    };
};

export const FavoritesContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(FavoritesFeedView);
