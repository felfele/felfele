import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { Actions } from '../actions/Actions';
import { StateProps, DispatchProps, IdentitySettings } from '../components/IdentitySettings';
import { ImageData} from '../models/ImageData';
import { TypedNavigation } from '../helpers/navigation';
import { LocalFeed } from '../social/api';

export const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const ownFeed = state.ownFeeds.length > 0
        ? state.ownFeeds[0]
        : undefined;
    return {
        author: state.author,
        navigation: ownProps.navigation,
        ownFeed,
        gatewayAddress: state.settings.swarmGatewayAddress,
   };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onUpdateAuthor: (text: string, ownFeed?: LocalFeed) => {
            dispatch(Actions.updateAuthorName(text));
            if (ownFeed != null) {
                dispatch(Actions.updateOwnFeed({
                    feedUrl: ownFeed.feedUrl,
                    name: text,
                }));
            }
        },
        onUpdatePicture: (image: ImageData, ownFeed?: LocalFeed) => {
            dispatch(Actions.updateAuthorImage(image));
            if (ownFeed != null) {
                dispatch(Actions.updateOwnFeed({
                    feedUrl: ownFeed.feedUrl,
                    authorImage: image,
                    favicon: undefined,
                }));
            }
        },
    };
};

export const IdentitySettingsContainer = connect(
   mapStateToProps,
   mapDispatchToProps,
)(IdentitySettings);
