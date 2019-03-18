import { connect } from 'react-redux';
import { StateProps, CategoriesScreen } from './CategoriesScreen';
import { AppState } from '../../../reducers';

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    return {
        categories: state.exploreData,
        navigation: ownProps.navigation,
    };
};

export const CategoriesContainer = connect(mapStateToProps)(CategoriesScreen);
