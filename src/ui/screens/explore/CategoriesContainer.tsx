import { connect } from 'react-redux';
import { StateProps, CategoriesScreen } from './CategoriesScreen';
import { AppState } from '../../../reducers';
import { serializeData } from '../../../models/recommendation/NewsSource';

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    return {
        categoryMap: serializeData(),
        navigation: ownProps.navigation,
    };
};

export const CategoriesContainer = connect(mapStateToProps)(CategoriesScreen);
