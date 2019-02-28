import { connect } from 'react-redux';
import { AppState } from '../reducers/index';
import { StateProps, DispatchProps, MemoizedCard } from '../components/Card';
import { Post } from '../models/Post';
import { AsyncActions } from '../actions/Actions';
import { ModelHelper } from '../models/ModelHelper';

interface OwnProps {
    isSelected: boolean;
    post: Post;
    modelHelper: ModelHelper;
    togglePostSelection: (post: Post) => void;
    navigate: (view: string, {}) => void;
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
        navigate: ownProps.navigate,
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
