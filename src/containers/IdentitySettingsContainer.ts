import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { AsyncActions } from '../actions/Actions';
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
        onUpdateAuthor: (text: string) => {
            dispatch(AsyncActions.updateProfileName(text));
        },
        onUpdatePicture: (image: ImageData, ownFeed?: LocalFeed) => {
            dispatch(AsyncActions.updateProfileImage(image));
        },
    };
};

export const IdentitySettingsContainer = connect(
   mapStateToProps,
   mapDispatchToProps,
)(IdentitySettings);
