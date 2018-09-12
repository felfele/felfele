import { connect } from 'react-redux';
import { AppState } from '../reducers/index';
import { AsyncActions, Actions } from '../actions/Actions';
import { StateProps, DispatchProps, EditPost } from '../components/EditPost';
import { Post } from '../models/Post';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
   return {
       navigation: ownProps.navigation,
       draft: state.draft,
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
