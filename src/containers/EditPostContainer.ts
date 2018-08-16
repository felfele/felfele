import { connect } from 'react-redux';
import { AppState } from '../reducers/index';
import { AsyncActions } from '../actions/Actions';
import { StateProps, DispatchProps, EditPost } from '../components/EditPost';
import { Post } from '../models/Post';
import { LocalPostManager } from '../LocalPostManager';
import { Debug } from '../Debug';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
   return {
       navigation: ownProps.navigation,
   };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
   return {
       onPost: (post: Post) => {
            dispatch(AsyncActions.addPost(post));
       },
   };
};

export const EditPostContainer = connect<StateProps, DispatchProps, {}>(
   mapStateToProps,
   mapDispatchToProps,
)(EditPost);
