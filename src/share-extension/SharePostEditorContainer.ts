import { connect } from 'react-redux';

import { AppState } from '../reducers/AppState';
import { StateProps } from '../components/PostEditor';
import { mapDispatchToProps } from '../containers/PostEditorContainer';
import { Post } from '../models/Post';

const mapStateToProps = (state: AppState, ownProps: { text: string }): StateProps => {
    const draft: Post = {
        images: [],
        createdAt: Date.now(),
        text: ownProps.text,
    };
    return {
        name: state.author.name,
        avatar: state.author.image,
        goBack: () => true,
        draft: draft,
        gatewayAddress: state.settings.swarmGatewayAddress,
   };
};

export const SharePostEditorContainer = connect(
    mapStateToProps,
    mapDispatchToProps
);
