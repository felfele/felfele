import { connect } from 'react-redux';
import { StateProps, NewsSourceGridScreen } from './NewsSourceGridScreen';
import { AppState } from '../../../reducers';

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    return {
        subCategoryName: ownProps.navigation.state.params.subCategoryName,
        gatewayAddress: state.settings.swarmGatewayAddress,
        newsSource: ownProps.navigation.state.params.newsSources,
        navigation: ownProps.navigation,
    };
};

export const NewsSourceGridContainer = connect(mapStateToProps)(NewsSourceGridScreen);
