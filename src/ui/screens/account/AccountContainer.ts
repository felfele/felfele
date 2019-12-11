import { connect } from 'react-redux';
import { AppState } from '../../../reducers/AppState';
import { Actions } from '../../../actions/Actions';
import { StateProps, DispatchProps, AccountScreen } from './AccountScreen';
import { TypedNavigation } from '../../../helpers/navigation';
import { AsyncActions } from '../../../actions/asyncActions';
import { ImageData } from '../../../models/ImageData';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const profile = {
        name: state.author.name,
        image: state.author.image,
        identity: state.author.identity!,
    };

    return {
        navigation: ownProps.navigation,
        settings: state.settings,
        profile,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onSaveToCameraRollValueChange: (value: boolean) => {
            dispatch(Actions.changeSettingSaveToCameraRoll(value));
        },
        onShowSquareImagesValueChange: (value: boolean) => {
            dispatch(Actions.changeSettingShowSquareImages(value));
        },
        onShowDebugMenuValueChange: (value: boolean) => {
            dispatch(Actions.changeSettingShowDebugMenu(value));
        },
        onUpdateAuthor: (text: string) => {
            dispatch(AsyncActions.updateProfileName(text));
        },
        onUpdatePicture: (image: ImageData) => {
            dispatch(AsyncActions.updateProfileImage(image));
        },
    };
};

export const AccountContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(AccountScreen);
