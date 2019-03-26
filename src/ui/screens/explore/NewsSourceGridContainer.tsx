import { connect } from 'react-redux';
import { StateProps, NewsSourceGridScreen, DispatchProps } from './NewsSourceGridScreen';
import { AppState } from '../../../reducers/AppState';
import { Feed } from '../../../models/Feed';
import { AsyncActions } from '../../../actions/Actions';
import { TypedNavigation, Routes } from '../../../helpers/navigation';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const subCategoryName = ownProps.navigation.getParam<'NewsSourceGridContainer', 'subCategoryName'>('subCategoryName');
    const newsSources = ownProps.navigation.getParam<'NewsSourceGridContainer', 'newsSources'>('newsSources');

    return {
        subCategoryName: subCategoryName,
        gatewayAddress: state.settings.swarmGatewayAddress,
        newsSource: newsSources,
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
