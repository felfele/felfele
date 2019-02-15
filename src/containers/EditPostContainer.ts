import { connect } from 'react-redux';
import { AppState } from '../reducers/index';
import { AsyncActions, Actions } from '../actions/Actions';
import { StateProps, DispatchProps, EditPost } from '../components/EditPost';
import { Post } from '../models/Post';
import { Debug } from '../Debug';

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    Debug.log('EditPostContainer.mapStateToProps: ', ownProps.navigation);
    const post = ownProps.navigation.state.params ! = null ? ownProps.navigation.state.params.post : null;
    return {
        name: state.author.name,
        avatar: state.author.image,
        navigation: ownProps.navigation,
        draft: post != null ? post : state.draft,
   };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
   return {
       onPost: (post: Post) => {
            dispatch(AsyncActions.createPost(post));
       },
       onSaveDraft: (draft: Post) => {
           dispatch(Actions.addDraft(draft));
       },
       onDeleteDraft: () => {
           dispatch(Actions.removeDraft());
       },
   };
};

export const EditPostContainer = connect(
   mapStateToProps,
   mapDispatchToProps,
)(EditPost);
