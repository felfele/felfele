import { connect } from 'react-redux';
import { StateProps, NewsSourceGridScreen, DispatchProps } from './NewsSourceGridScreen';
import { AppState } from '../../../reducers/AppState';
import { Feed } from '../../../models/Feed';
import { AsyncActions } from '../../../actions/Actions';

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    return {
        subCategoryName: ownProps.navigation.state.params.subCategoryName,
        gatewayAddress: state.settings.swarmGatewayAddress,
        newsSource: ownProps.navigation.state.params.newsSources,
        navigation: ownProps.navigation,
    };
};

export const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        downloadPostsForNewsSource: (feed: Feed) => {
            dispatch(AsyncActions.downloadPostsFromFeeds([feed]));
        },
    };
};

export const NewsSourceGridContainer = connect(mapStateToProps, mapDispatchToProps)(NewsSourceGridScreen);
