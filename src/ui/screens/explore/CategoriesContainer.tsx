import { connect } from 'react-redux';
import { StateProps, CategoriesScreen } from './CategoriesScreen';
import { AppState } from '../../../reducers';
import { exploreData } from '../../../models/recommendation/NewsSource';

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    return {
        categories: exploreData,
        navigation: ownProps.navigation,
    };
};

export const CategoriesContainer = connect(mapStateToProps)(CategoriesScreen);
