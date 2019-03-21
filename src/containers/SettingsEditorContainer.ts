import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { Actions } from '../actions/Actions';
import { StateProps, DispatchProps, SettingsEditor } from '../components/SettingsEditor';

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    return {
        navigation: ownProps.navigation,
        settings: state.settings,
        ownFeeds: state.ownFeeds,
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
    };
};

export const SettingsEditorContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(SettingsEditor);
