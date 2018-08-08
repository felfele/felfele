import { connect } from 'react-redux';
import { AppState } from '../reducers';
import * as Actions from '../actions/actions';
import { StateProps, DispatchProps, FilterListEditor } from '../components/FilterListEditor';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
   return {
       navigation: ownProps.navigation,
       filters: state.contentFilters.toArray(),
   };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
   return {
   };
};

export const FilterListEditorContainer = connect<StateProps, DispatchProps, {}>(
   mapStateToProps,
   mapDispatchToProps,
)(FilterListEditor);
