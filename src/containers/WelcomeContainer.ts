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
        onUpdateAuthor: (text: string) => {
            dispatch(Actions.updateAuthorName(text));
        },
        onUpdatePicture: (image: ImageData) => {
            dispatch(Actions.updateAuthorPicturePath(image));
        },
        onDownloadPosts: () => {
            dispatch(AsyncActions.downloadFollowedFeedPosts());
        },
        onCreateFeed: () => {
            dispatch(AsyncActions.chainActions([AsyncActions.createUserIdentity(), AsyncActions.createOwnFeed()]));
        },
    };
};

export const WelcomeContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(Welcome);
