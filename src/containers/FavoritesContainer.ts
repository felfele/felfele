import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { StateProps, DispatchProps } from '../components/FavoritesFeedView';
import { AsyncActions } from '../actions/asyncActions';
import { Feed } from '../models/Feed';
import { FavoritesFeedView } from '../components/FavoritesFeedView';
import { getFavoriteFeedsPosts, getFavoriteFeeds } from '../selectors/selectors';
import { TypedNavigation } from '../helpers/navigation';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const posts = getFavoriteFeedsPosts(state);
    const favoriteFeeds = getFavoriteFeeds(state);

    return {
        navigation: ownProps.navigation,
        posts: posts,
        feeds: favoriteFeeds,
        gatewayAddress: state.settings.swarmGatewayAddress,
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
