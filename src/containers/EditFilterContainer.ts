import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { Actions } from '../actions/Actions';
import { StateProps, DispatchProps, EditFilter } from '../components/EditFilter';
import { Feed } from '../models/Feed';
import { ContentFilter } from '../models/ContentFilter';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    return {
        filter: ownProps.navigation.state.params.filter,
        navigation: ownProps.navigation,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
        onAddFilter: (filter: ContentFilter) => {
            dispatch(Actions.addContentFilterAction(
                filter.text,
                filter.createdAt,
                filter.validUntil,
            ));
        },
        onRemoveFilter: (filter: ContentFilter) => {
            dispatch(Actions.removeContentFilterAction(filter));
        },
    };
};

export const EditFilterContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(EditFilter);
