import * as React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { FragmentSafeAreaViewWithoutTabBar } from '../../misc/FragmentSafeAreaView';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { ImageDataView } from '../../../components/ImageDataView';
import { ReactNativeModelHelper } from '../../../models/ReactNativeModelHelper';
import { defaultImages } from '../../../defaultImages';
import { Colors, ComponentColors } from '../../../styles';
import * as AreYouSureDialog from '../../../components/AreYouSureDialog';
import { TwoButton } from '../../buttons/TwoButton';
import { TypedNavigation } from '../../../helpers/navigation';
import { RegularText } from '../../misc/text';
import { InviteCode } from '../../../models/InviteCode';
import { generateSecureRandom } from '../../../helpers/secureRandom';
import { PublicProfile } from '../../../models/Profile';
import { createSwarmContactHelper } from '../../../helpers/swarmContactHelpers';

export interface StateProps {
    inviteCode: InviteCode;
    navigation: TypedNavigation;
    gatewayAddress: string;
    profile: PublicProfile;
}

export interface DispatchProps { }

export type Props = StateProps & DispatchProps;

export const ContactConfirm = (props: Props) => {
    const imageWidth = Dimensions.get('window').width * 0.65;
    const title = props.inviteCode.profileName != null ? props.inviteCode.profileName : 'Add contact';
    const modelHelper = new ReactNativeModelHelper(props.gatewayAddress);
    return (
        <FragmentSafeAreaViewWithoutTabBar>
            <NavigationHeader
                title={title}
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
            <View>
                <View style={styles.profileImageContainer}>
                    <ImageDataView
                        source={{ localPath: defaultImages.defaultUser }}
                        defaultImage={defaultImages.defaultUser}
                        style={[styles.profileImage, {
                            width: imageWidth,
                            height: imageWidth,
                            borderRadius: imageWidth / 2,
                        }]}
                        modelHelper={modelHelper}
                    />
                </View>
                <RegularText style={{ textAlign: 'center', color: Colors.BROWNISH_GRAY }}>
                    {`Connect with ${props.inviteCode.profileName}?`}
                </RegularText>
                <TwoButton
                    leftButton={{
                        label: 'Cancel',
                        style: { marginTop: 20, backgroundColor: ComponentColors.SECONDARY_RECTANGULAR_BUTTON_COLOR },
                        icon: <Icon name='close' color={Colors.BLACK} size={24}/>,
                        onPress: () => cancelContact(props.navigation),
                        fontStyle: { color: Colors.BLACK },
                    }}
                    rightButton={{
                        label: 'Create contact',
                        style: { marginTop: 20 },
                        icon: <Icon name='check' color={Colors.BRAND_PURPLE} size={24}/>,
                        onPress: () => addContact(props.navigation, props.inviteCode, props.profile, props.gatewayAddress),
                    }}
                />
                <RegularText style={{ textAlign: 'center', color: Colors.BROWNISH_GRAY }}>
                    {'Creating a contact will open a private channel between the two of you.'}
                </RegularText>
            </View>
        </FragmentSafeAreaViewWithoutTabBar>
    );
};

const addContact = (navigation: TypedNavigation, inviteCode: InviteCode, profile: PublicProfile, swarmGateway: string) => {
    const contactHelper = createSwarmContactHelper(
        profile,
        swarmGateway,
        generateSecureRandom
    );

    navigation.navigate('ContactLoader', {
        inviteCode: inviteCode,
        contactHelper: contactHelper,
    });
};

const cancelContact = async (navigation: TypedNavigation) => {
    const confirmUnfollow = await AreYouSureDialog.show('Are you sure you want to delete the contact?');
    if (confirmUnfollow) {
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
        marginVertical: 10,
    },
});
