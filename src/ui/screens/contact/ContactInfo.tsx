import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { FragmentSafeAreaViewWithoutTabBar } from '../../misc/FragmentSafeAreaView';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { Contact, MutualContact } from '../../../models/Contact';
import { TypedNavigation } from '../../../helpers/navigation';
import { ContactVerificationView } from './ContactVerification';
import { PublicProfile } from '../../../models/Profile';
import { WideButton } from '../../buttons/WideButton';
import { ImageDataView } from '../../../components/ImageDataView';
import { ReactNativeModelHelper } from '../../../models/ReactNativeModelHelper';
import { defaultImages } from '../../../defaultImages';
import { Colors } from '../../../styles';
import { UnknownContact } from '../../../helpers/contactHelpers';
import * as AreYouSureDialog from '../../../components/AreYouSureDialog';

export interface StateProps {
    contact: Contact | UnknownContact;
    navigation: TypedNavigation;
    profile: PublicProfile;
    gatewayAddress: string;
}

export interface DispatchProps {
    onConfirmContact: (contact: MutualContact) => void;
    onRemoveContact: (contact: Contact) => void;
}

export type Props = StateProps & DispatchProps;

export const ContactInfo = (props: Props) => {
    const mutualContact = props.contact != null && props.contact.type === 'mutual-contact'
        ? props.contact
        : undefined
    ;
    const contactName = mutualContact != null
        ? mutualContact.name
        : 'Contact'
    ;
    const modelHelper = new ReactNativeModelHelper(props.gatewayAddress);
    return (
        <FragmentSafeAreaViewWithoutTabBar>
            <NavigationHeader
                title={contactName}
                navigation={props.navigation}
            />
            { mutualContact != null &&
                <View>
                    <View style={styles.profileImageContainer}>
                        <ImageDataView
                            source={mutualContact.image}
                            defaultImage={defaultImages.defaultUser}
                            style={styles.profileImage}
                            modelHelper={modelHelper}
                        />
                    </View>
                    <ContactVerificationView
                        contact={mutualContact}
                        ownIdentity={props.profile.identity}
                        onConfirmContact={props.onConfirmContact}
                        onRemoveContact={(contact) => onRemoveContact(props, contact)}
                    />
                </View>
            }
            {mutualContact != null && mutualContact.confirmed &&
                <WideButton
                    label={'DELETE'}
                    style={{marginTop: 20}}
                    icon={<Icon name='account-alert' color={Colors.BRAND_PURPLE} size={24} />}
                    onPress={() => onRemoveContact(props, mutualContact)}
                />
            }
        </FragmentSafeAreaViewWithoutTabBar>
    );
};

const onRemoveContact = async (props: Props, contact: Contact) => {
    const confirmUnfollow = await AreYouSureDialog.show('Are you sure you want to delete the contact?');
    if (confirmUnfollow) {
        props.onRemoveContact(contact);
    }
};

const styles = StyleSheet.create({
    profileImageContainer: {
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        marginBottom: 10,
        padding: 10,
    },
    profileImage: {
        borderRadius : 72.5,
        width: 145,
        height: 145,
        marginVertical: 10,
    },
});
