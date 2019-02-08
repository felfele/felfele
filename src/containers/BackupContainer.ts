import { connect } from 'react-redux';
import { AppState } from '../reducers/index';
import { StateProps, DispatchProps, Backup } from '../components/Backup';

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    return {
        navigation: ownProps.navigation,
        appState: state,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
    };
};

export const BackupContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(Backup);
