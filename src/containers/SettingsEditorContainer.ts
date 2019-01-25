import { connect } from 'react-redux';
import { AppState } from '../models/AppState';
import { Actions } from '../actions/Actions';
import { StateProps, DispatchProps, SettingsEditor } from '../components/SettingsEditor';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    return {
        navigation: ownProps.navigation,
        settings: state.settings,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
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
    };
};

export const SettingsEditorContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(SettingsEditor);
