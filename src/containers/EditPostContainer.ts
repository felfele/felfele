import { connect } from 'react-redux';
import { AppState } from '../reducers/index';
import { AsyncActions, Actions } from '../actions/Actions';
import { StateProps, DispatchProps, EditPost } from '../components/EditPost';
import { Post } from '../models/Post';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    console.log('EditPostContainer.mapStateToProps: ', ownProps.navigation);
    const post = ownProps.navigation.state.params ! = null ? ownProps.navigation.state.params.post : null;
    return {
       navigation: ownProps.navigation,
       draft: post != null ? post : state.draft,
   };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
   return {
       onPost: (post: Post) => {
            dispatch(AsyncActions.addPost(post));
       },
       onSaveDraft: (draft: Post) => {
           dispatch(Actions.addDraft(draft));
       },
       onDeleteDraft: () => {
           dispatch(Actions.removeDraft());
       },
   };
};

export const EditPostContainer = connect<StateProps, DispatchProps, {}>(
   mapStateToProps,
   mapDispatchToProps,
)(EditPost);
