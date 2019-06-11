import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { Actions } from '../actions/Actions';
import { StateProps, DispatchProps, EditFilter } from '../components/EditFilter';
import { ContentFilter } from '@felfele/felfele-core';
import { TypedNavigation } from '../helpers/navigation';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    return {
        filter: ownProps.navigation.getParam<'EditFilter', 'filter'>('filter'),
        navigation: ownProps.navigation,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onAddFilter: (filter: ContentFilter) => {
            dispatch(Actions.addContentFilter(
                filter.text,
                filter.createdAt,
                filter.validUntil,
            ));
        },
        onRemoveFilter: (filter: ContentFilter) => {
            dispatch(Actions.removeContentFilter(filter));
        },
    };
};

export const EditFilterContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(EditFilter);
