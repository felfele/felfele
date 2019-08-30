import { connect } from 'react-redux';

import { AppState } from '../reducers/AppState';
import { StateProps, DispatchProps, PostEditor } from '../components/PostEditor';
import { Post } from '../models/Post';
import { ImageData } from '../models/ImageData';
import { TypedNavigation } from '../helpers/navigation';

interface OwnProps {
    screenProps: {
        images: ImageData[];
        text: string;
        goBack: () => boolean;
        dismiss: () => void;
    };
    navigation: TypedNavigation;
}

const mapStateToProps = (
    state: AppState,
    ownProps: OwnProps,
): StateProps => {
    const draft: Post = {
        createdAt: Date.now(),
        images: ownProps.screenProps.images,
        text: ownProps.screenProps.text,
    };
    return {
        name: state.author.name,
        avatar: state.author.image,
        goBack: ownProps.screenProps.goBack,
        draft: draft,
        gatewayAddress: state.settings.swarmGatewayAddress,
        dismiss: ownProps.screenProps.dismiss,
   };
};

export const mapDispatchToProps = (dispatch: any, ownProps: OwnProps): DispatchProps => {
    return {
        onPost: (post: Post) => {
            ownProps.navigation.navigate('ShareWithContainer', {
                post,
                selectedFeeds: [],
            });
        },
        onSaveDraft: (draft: Post) => {
        },
        onDeleteDraft: () => {
        },
    };
 };

export const SharePostEditorContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(PostEditor);
