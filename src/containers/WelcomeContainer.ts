import { connect } from 'react-redux';
import { StateProps, DispatchProps, Welcome } from '../components/Welcome';
import { AppState } from '../reducers';
import { AsyncActions, Actions } from '../actions/Actions';
import { ImageData } from '../models/ImageData';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    return {
        navigation: ownProps.navigation,
        author: state.author,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
        onCreateIdentity: () => {
            dispatch(AsyncActions.createUserIdentity());
        },
        onUpdateAuthor: (text: string) => {
            dispatch(Actions.updateAuthorName(text));
        },
        onUpdatePicture: (image: ImageData) => {
            dispatch(Actions.updateAuthorPicturePath(image));
        },
        onDownloadPosts: () => {
            dispatch(AsyncActions.downloadPosts());
        },
    };
};

export const WelcomeContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps
)(Welcome);
