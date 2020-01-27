import { connect } from 'react-redux';
import { AppState } from '../../../reducers/AppState';
import { StateProps, DispatchProps, ExportFeedsScreen } from './ExportFeedsScreen';
import { TypedNavigation } from '../../../helpers/navigation';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    return {
        navigation: ownProps.navigation,
        appState: state,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
    };
};

export const ExportFeedsScreenContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(ExportFeedsScreen);
