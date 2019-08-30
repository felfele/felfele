import { connect } from 'react-redux';

import { AppState } from '../reducers/AppState';
import { StateProps, DispatchProps, PostEditor } from '../components/PostEditor';
// import { mapDispatchToProps } from '../containers/PostEditorContainer';
import { Post } from '../models/Post';
import { Debug } from '../Debug';
import { ImageData } from '../models/ImageData';
import { TypedNavigation } from '../helpers/navigation';
import { Actions } from '../actions/Actions';

interface OwnProps {
    images: ImageData[];
    text: string;
    navigation: TypedNavigation;
    goBack: () => boolean;
    dismiss: () => void;
}

const mapStateToProps = (
    state: AppState,
    ownProps: OwnProps,
): StateProps => {
    const draft: Post = {
        createdAt: Date.now(),
        images: ownProps.images,
        text: ownProps.text,
    };
    Debug.log('SharePostEditorContainer.mapStateToProps', ownProps);
    return {
        name: state.author.name,
        avatar: state.author.image,
        goBack: ownProps.goBack,
        draft: draft,
        gatewayAddress: state.settings.swarmGatewayAddress,
        dismiss: ownProps.dismiss,
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

export const SharePostEditorContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(PostEditor);
