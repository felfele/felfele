import { connect } from 'react-redux';
import { StateProps, SubCategoriesScreen, OwnProps } from './SubCategoriesScreen';
import { AppState } from '../../../reducers/AppState';

const mapStateToProps = (state: AppState, ownProps: OwnProps): StateProps => {
    return {
        title: ownProps.navigation.state.params.title,
        subCategories: ownProps.navigation.state.params.subCategories,
        navigation: ownProps.navigation,
    };
};

export const SubCategoriesContainer = connect(mapStateToProps)(SubCategoriesScreen);
