import { connect } from 'react-redux';
import { StateProps, DispatchProps, Welcome } from '../components/Welcome';
import { AppState } from '../reducers';
import { AsyncActions, Actions } from '../actions/Actions';
import { ImageData } from '../models/ImageData';

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    return {
        navigation: ownProps.navigation,
        author: state.author,
        gatewayAddress: state.settings.swarmGatewayAddress,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onStartDownloadFeeds: () => {
            dispatch(AsyncActions.downloadFollowedFeedPosts());
        },
        onCreateUser: async (name: string, image: ImageData, navigation: any) => {
            await dispatch(AsyncActions.chainActions([
                Actions.updateAuthorName(name),
                Actions.updateAuthorPicturePath(image),
                AsyncActions.createUserIdentity(),
                AsyncActions.createOwnFeed(),
            ]));
            navigation.navigate('Loading');
        },
    };
};

export const WelcomeContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(Welcome);
