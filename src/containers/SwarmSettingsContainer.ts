import { connect } from 'react-redux';
import { AppState } from '../reducers/index';
import { Actions } from '../actions/Actions';
import { StateProps, DispatchProps, SwarmSettings } from '../components/SwarmSettings';

const mapStateToProps = (state: AppState, ownProps: any): StateProps => {
    return {
        swarmGatewayAddress: state.settings.swarmGatewayAddress,
        navigation: ownProps.navigation,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onChangeSwarmGatewayAddress: (address: string) => {
            dispatch(Actions.changeSettingSwarmGatewayAddress(address));
        },
    };
};

export const SwarmSettingsContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(SwarmSettings);
