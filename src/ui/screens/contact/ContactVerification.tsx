import * as React from 'react';
import { View, LayoutAnimation, StyleSheet } from 'react-native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { MutualContact, Contact } from '../../../models/Contact';
import { PublicIdentity } from '../../../models/Identity';
import { calculateVerificationCode } from '../../../helpers/contactHelpers';
import { RegularText, MediumText } from '../../misc/text';
import { TwoButton } from '../../buttons/TwoButton';
import { Colors } from '../../../styles';

const Icon = (props: {name: string, color?: string | undefined}) =>
    <MaterialCommunityIcon name={props.name} size={24} color={props.color} />;

const VerificationCodeView = (props: {
    contact: MutualContact,
    ownIdentity: PublicIdentity,
    onConfirmContact: (contact: MutualContact) => void;
    onRemoveContact: (contact: Contact) => void;
}) => {
    const verificationCode = calculateVerificationCode(props.contact.identity.publicKey);
    const yourVerificationCode = calculateVerificationCode(props.ownIdentity.publicKey);
    return (
        <View style={styles.verificationContainer}>
            <RegularText>Verification code</RegularText>
            <MediumText>{verificationCode}</MediumText>
            <RegularText>Your code</RegularText>
            <MediumText>{yourVerificationCode}</MediumText>
            <TwoButton
                leftButton={{
                    label: 'Confirm',
                    icon: <Icon name='account-check' color={Colors.BRAND_PURPLE} />,
                    onPress: () => {
                        LayoutAnimation.linear();
                        props.onConfirmContact(props.contact);
                    },
                }}
                rightButton={{
                    label: 'Delete',
                    icon: <Icon name='account-alert' color={Colors.BRAND_PURPLE} />,
                    onPress: () => props.onRemoveContact(props.contact),
                }}
            />
        </View>
    );
};

interface Props {
    contact: Contact;
    ownIdentity: PublicIdentity;
    onConfirmContact: (contact: MutualContact) => void;
    onRemoveContact: (contact: Contact) => void;
}

export const ContactVerificationView = (props: Props) => {
    return props.contact.type === 'mutual-contact' && props.contact.confirmed === false
        ? <VerificationCodeView {...props} contact={props.contact} />
        : null
    ;
};

const styles = StyleSheet.create({
    verificationContainer: {
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
