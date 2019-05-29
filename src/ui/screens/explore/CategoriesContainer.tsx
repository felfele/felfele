import { connect } from 'react-redux';
import { StateProps, CategoriesScreen } from './CategoriesScreen';
import { AppState } from '../../../reducers/AppState';
import { exploreData } from '../../../models/recommendation/NewsSource';
import { TypedNavigation } from '../../../helpers/navigation';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    return {
        categories: exploreData,
        navigation: ownProps.navigation,
    };
};

export const CategoriesContainer = connect(mapStateToProps)(CategoriesScreen);
