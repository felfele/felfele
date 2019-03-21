import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import * as Actions from '../actions/Actions';
import { StateProps, DispatchProps, Restore } from '../components/Restore';

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    return {
        navigation: ownProps.navigation,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onRestoreData: (data: string, secretHex: string) => {
            dispatch(Actions.AsyncActions.restoreFromBackup(data, secretHex));
        },
    };
};

export const RestoreContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(Restore);
