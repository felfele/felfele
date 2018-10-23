import { connect } from 'react-redux';
import { AppState } from '../reducers/index';
import { Actions } from '../actions/Actions';
import { StateProps, DispatchProps, IdentitySettings } from '../components/IdentitySettings';
import { IdentityOnboarding } from '../components/IdentityOnboarding';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    return {
        author: state.author,
        navigation: ownProps.navigation,
   };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
        onUpdateAuthor: (text: string) => {
            dispatch(Actions.updateAuthorName(text));
        },
        onUpdatePicture: (path: string) => {
            dispatch(Actions.updatePicturePath(path));
        },
    };
};

export const IdentitySettingsContainer = connect<StateProps, DispatchProps, {}>(
   mapStateToProps,
   mapDispatchToProps,
)(IdentitySettings);

export const IdentityOnboardingContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
 )(IdentityOnboarding);
