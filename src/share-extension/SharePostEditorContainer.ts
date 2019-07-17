import { connect } from 'react-redux';
// @ts-ignore
import ShareExtension from 'react-native-share-extension';

import { AppState } from '../reducers/AppState';
import { StateProps, PostEditor } from '../components/PostEditor';
import { mapDispatchToProps } from '../containers/PostEditorContainer';
import { Post } from '../models/Post';

const mapStateToProps = (state: AppState, ownProps: { text: string | null, goBack: () => boolean }): StateProps => {
    const draft: Post = {
        images: [],
        createdAt: Date.now(),
        text: ownProps.text,
    };
    return {
        name: state.author.name,
        avatar: state.author.image,
        goBack: ownProps.goBack,
        draft: draft,
        gatewayAddress: state.settings.swarmGatewayAddress,
   };
};

export const SharePostEditorContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(PostEditor);
