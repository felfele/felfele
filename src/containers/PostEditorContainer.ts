import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { StateProps, DispatchProps, PostEditor } from '../components/PostEditor';
import { Post } from '../models/Post';
import { TypedNavigation } from '../helpers/navigation';
import { Actions } from '../actions/Actions';
import { Debug } from '../Debug';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const goBack = () => {
        Debug.log('PostEditorContainer.mapStateToProps.goBack');
        return ownProps.navigation.goBack();
    };
    return {
        name: state.author.name,
        avatar: state.author.image,
        goBack,
        draft: state.draft,
        gatewayAddress: state.settings.swarmGatewayAddress,
   };
};

export const mapDispatchToProps = (dispatch: any, ownProps: { navigation: TypedNavigation }): DispatchProps => {
   return {
       onPost: (post: Post) => {
            const selectedFeeds = ownProps.navigation.getParam<'Post', 'selectedFeeds'>('selectedFeeds');
            Debug.log('PostEditorContainer.mapDispatchToProps', {selectedFeeds});
            // dispatch(AsyncActions.createPost(post));
            ownProps.navigation.navigate('ShareWithContainer', {
                post,
                selectedFeeds,
            });
       },
       onSaveDraft: (draft: Post) => {
           dispatch(Actions.addDraft(draft));
       },
       onDeleteDraft: () => {
           dispatch(Actions.removeDraft());
       },
   };
};

export const PostEditorContainer = connect(
   mapStateToProps,
   mapDispatchToProps,
)(PostEditor);
