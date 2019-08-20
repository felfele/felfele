import { connect } from 'react-redux';

import { AppState } from '../reducers/AppState';
import { StateProps, PostEditor } from '../components/PostEditor';
import { mapDispatchToProps } from '../containers/PostEditorContainer';
import { Post } from '../models/Post';
import { Debug } from '../Debug';
import { ImageData } from '../models/ImageData';
import { Image } from 'react-native';

const mapStateToProps = (
    state: AppState,
    ownProps: { images: ImageData[], text: string, goBack: () => boolean, dismiss: () => void }
): StateProps => {
    const draft: Post = {
        createdAt: Date.now(),
        images: ownProps.images,
        text: ownProps.text,
    };
    return {
        name: state.author.name,
        avatar: state.author.image,
        goBack: ownProps.goBack,
        draft: draft,
        gatewayAddress: state.settings.swarmGatewayAddress,
        dismiss: ownProps.dismiss,
   };
};

export const SharePostEditorContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(PostEditor);
