import { connect } from 'react-redux';
import { ApplicationState } from '../models/ApplicationState';
import { AsyncActions, Actions } from '../actions/Actions';
import { StateProps, DispatchProps, EditPost } from '../components/EditPost';
import { Post } from '../models/Post';
import { Debug } from '../Debug';

const mapStateToProps = (state: ApplicationState, ownProps): StateProps => {
    Debug.log('EditPostContainer.mapStateToProps: ', ownProps.navigation);
    const post = ownProps.navigation.state.params ! = null ? ownProps.navigation.state.params.post : null;
    return {
       navigation: ownProps.navigation,
       draft: post != null ? post : state.draft,
   };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
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

export const EditPostContainer = connect<StateProps, DispatchProps, {}>(
   mapStateToProps,
   mapDispatchToProps,
)(EditPost);
