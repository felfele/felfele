import { connect } from 'react-redux';
import { ApplicationState } from '../models/ApplicationState';
import { Actions } from '../actions/Actions';
import { StateProps, DispatchProps, IdentitySettings } from '../components/IdentitySettings';
import { ImageData} from '../models/ImageData';

export const mapStateToProps = (state: ApplicationState, ownProps): StateProps => {
    const ownFeed = state.ownFeeds.length > 0
        ? state.ownFeeds[0]
        : undefined;
    return {
        author: state.author,
        navigation: ownProps.navigation,
        ownFeed,
   };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
        onUpdateAuthor: (text: string) => {
            dispatch(Actions.updateAuthorName(text));
        },
        onUpdatePicture: (image: ImageData) => {
            dispatch(Actions.updateAuthorPicturePath(image));
        },
    };
};

export const IdentitySettingsContainer = connect<StateProps, DispatchProps, {}>(
   mapStateToProps,
   mapDispatchToProps,
)(IdentitySettings);
