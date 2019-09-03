import { connect } from 'react-redux';
import { AppState } from '../../../reducers/AppState';
import { StateProps, ContactSuccess } from './ContactSuccess';
import { TypedNavigation } from '../../../helpers/navigation';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const contact = ownProps.navigation.getParam<'ContactSuccess', 'contact'>('contact');
    const isReceiver = ownProps.navigation.getParam<'ContactSuccess', 'isReceiver'>('isReceiver');
    return {
        contact,
        isReceiver,
        navigation: ownProps.navigation,
        gatewayAddress: state.settings.swarmGatewayAddress,
    };
};

export const ContactSuccessContainer = connect(
    mapStateToProps,
)(ContactSuccess);
