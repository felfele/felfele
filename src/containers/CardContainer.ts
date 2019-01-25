import { connect } from 'react-redux';
import { AppState } from '../models/AppState';
import { StateProps, DispatchProps, MemoizedCard } from '../components/Card';
import { Post } from '../models/Post';
import { AsyncActions } from '../actions/Actions';

interface OwnProps {
    isSelected: boolean;
    post: Post;
    togglePostSelection: (post: Post) => void;
    navigate: (view: string, {}) => void;
}

const mapStateToProps = (state: AppState, ownProps: OwnProps): StateProps => {
    return {
        post: ownProps.post,
        currentTimestamp: state.currentTimestamp,
        isSelected: ownProps.isSelected,
        showSquareImages: state.settings.showSquareImages,
        togglePostSelection: ownProps.togglePostSelection,
        navigate: ownProps.navigate,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
        onDeletePost: (post: Post) => {
            dispatch(AsyncActions.removePost(post));
        },
        onSharePost: (post: Post) => {
            if (post.link != null) {
                return;
            }
            dispatch(AsyncActions.sharePost(post));
        },
    };
};

export const CardContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps
)(MemoizedCard);
