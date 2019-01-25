import { connect } from 'react-redux';
import { StateProps, DispatchProps, LoadingScreen } from '../components/LoadingScreen';
import { AppState } from '../models/AppState';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    return {
        author: state.author,
        navigation: ownProps.navigation,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return { };
};

export const LoadingScreenContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps
)(LoadingScreen);
