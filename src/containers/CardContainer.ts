import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { StateProps, DispatchProps, MemoizedCard } from '../components/Card';
import { Post } from '../models/Post';
import { AsyncActions } from '../actions/Actions';
import { ModelHelper } from '../models/ModelHelper';
import { TypedNavigation } from '../helpers/navigation';

interface OwnProps {
    isSelected: boolean;
    post: Post;
    modelHelper: ModelHelper;
    togglePostSelection: (post: Post) => void;
    navigation: TypedNavigation;
}

const mapStateToProps = (state: AppState, ownProps: OwnProps): StateProps => {
    return {
        post: ownProps.post,
        currentTimestamp: state.currentTimestamp,
        isSelected: ownProps.isSelected,
        showSquareImages: state.settings.showSquareImages,
        author: state.author,
        modelHelper: ownProps.modelHelper,
        togglePostSelection: ownProps.togglePostSelection,
        navigation: ownProps.navigation,
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
    };
};

export const CardContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(MemoizedCard);
