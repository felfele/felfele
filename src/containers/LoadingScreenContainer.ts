import { connect } from 'react-redux';
import { StateProps, DispatchProps, LoadingScreen } from '../components/LoadingScreen';
import { AppState } from '../reducers/AppState';
import { TypedNavigation } from '../helpers/navigation';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    return {
        author: state.author,
        navigation: ownProps.navigation,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return { };
};

export const LoadingScreenContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(LoadingScreen);
