import { connect } from 'react-redux';
import { StateProps, SubCategoriesScreen, OwnProps } from './SubCategoriesScreen';
import { AppState } from '../../../reducers/AppState';
import { Routes } from '../../../helpers/navigation';

const mapStateToProps = (state: AppState, ownProps: OwnProps): StateProps => {
    const navParamTitle = ownProps.navigation.getParam<Routes['SubCategoriesContainer'], 'title'>('title');
    const navParamSubCategories = ownProps.navigation.getParam<Routes['SubCategoriesContainer'], 'subCategories'>('subCategories');
    return {
        title: navParamTitle,
        subCategories: navParamSubCategories,
        navigation: ownProps.navigation,
    };
};

export const SubCategoriesContainer = connect(mapStateToProps)(SubCategoriesScreen);
