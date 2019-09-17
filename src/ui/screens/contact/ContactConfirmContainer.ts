import { connect } from 'react-redux';
import { AppState } from '../../../reducers/AppState';
import { Actions } from '../../../actions/Actions';
import { StateProps, DispatchProps, ContactConfirm } from './ContactConfirm';
import { TypedNavigation } from '../../../helpers/navigation';
import { MutualContact, Contact } from '../../../models/Contact';

const mapStateToProps = (state: AppState, ownProps: {navigation: TypedNavigation}): StateProps => {
    const inviteCode = ownProps.navigation.getParam<'ContactConfirm', 'inviteCode'>('inviteCode');
    return {
        inviteCode,
        navigation: ownProps.navigation,
        gatewayAddress: state.settings.swarmGatewayAddress,
        profile: {
            name: state.author.name,
            image: state.author.image,
            identity: state.author.identity!,
        },
    };
};

export const ContactConfirmContainer = connect(
    mapStateToProps,
)(ContactConfirm);
