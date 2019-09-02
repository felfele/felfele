import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { FragmentSafeAreaViewWithoutTabBar } from '../../misc/FragmentSafeAreaView';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { Contact } from '../../../models/Contact';
import { ImageDataView } from '../../../components/ImageDataView';
import { ReactNativeModelHelper } from '../../../models/ReactNativeModelHelper';
import { defaultImages } from '../../../defaultImages';
import { Colors, ComponentColors } from '../../../styles';
import * as AreYouSureDialog from '../../../components/AreYouSureDialog';
import { TwoButton } from '../../buttons/TwoButton';
import { StateProps, DispatchProps } from './ContactInfo';
import { TypedNavigation } from '../../../helpers/navigation';

export type Props = StateProps & DispatchProps;

export const ContactConfirm = (props: Props) => {
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
                leftButton={{
                    onPress: () => props.navigation.goBack(),
                    label: <Icon
                                name={'close'}
                                size={20}
                                color={ComponentColors.NAVIGATION_BUTTON_COLOR}
                            />,
                }}
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
                    <TwoButton
                        leftButton={{
                            label: 'Cancel',
                            style: { marginTop: 20, backgroundColor: ComponentColors.SECONDARY_RECT_BUTTON_COLOR },
                            icon: <Icon name='close' color={Colors.BLACK} size={24}/>,
                            onPress: () => removeContact(props.onRemoveContact, mutualContact, props.navigation),
                            fontStyle: { color: Colors.BLACK },
                        }}
                        rightButton={{
                            label: 'Create contact',
                            style: { marginTop: 20 },
                            icon: <Icon name='check' color={Colors.BRAND_PURPLE} size={24}/>,
                            onPress: () => props.onConfirmContact(mutualContact),
                        }}
                    />
                </View>
            }
        </FragmentSafeAreaViewWithoutTabBar>
    );
};

const removeContact = async (
    onRemoveContact: (contact: Contact) => void,
    contact: Contact,
    navigation: TypedNavigation,
) => {
    const confirmUnfollow = await AreYouSureDialog.show('Are you sure you want to delete the contact?');
    if (confirmUnfollow) {
        onRemoveContact(contact);
        navigation.popToTop();
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
