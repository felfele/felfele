import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { StateProps, DispatchProps, FilterListEditor } from '../components/FilterListEditor';
import { ContentFilter } from '../models/ContentFilter';

const sortFilters = (a: ContentFilter, b: ContentFilter): number => {
    const aTimeUntil = a.createdAt + a.validUntil;
    const bTimeUntil = b.createdAt + b.validUntil;
    const timeDiff = bTimeUntil - aTimeUntil;
    if (timeDiff !== 0) {
        return timeDiff;
    }
    if (a.text < b.text) {
        return -1;
    }
    if (a.text > b.text) {
        return 1;
    }
    return 0;
};

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
   return {
       navigation: ownProps.navigation,
       filters: state.contentFilters.sort(sortFilters),
   };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
   return {
   };
};

export const FilterListEditorContainer = connect(
   mapStateToProps,
   mapDispatchToProps,
)(FilterListEditor);
