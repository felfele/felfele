import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { Actions } from '../actions/actions';
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
        onAddFilter: (filter: string) => {
            dispatch(Actions.addContentFilterAction(
                filter,
                Date.now(),
                0,
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
