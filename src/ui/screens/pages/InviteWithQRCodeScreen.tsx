import * as React from 'react';
import { StyleSheet, KeyboardAvoidingView, View, ScrollView, Dimensions } from 'react-native';
import { FragmentSafeAreaViewWithoutTabBar } from '../../misc/FragmentSafeAreaView';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { FloatingButton } from '../../misc/FloatingButton';
import { TypedNavigation } from '../../../helpers/navigation';
import Icon, { CloseIcon } from '../../../CustomIcon';
import { RegularText, BoldText } from '../../misc/text';
import { Colors, ComponentColors } from '../../../styles';
import { PrimaryButton } from '../../misc/Button';
import QRCode from 'react-native-qrcode-svg';

interface DispatchProps {
}

interface StateProps {
    navigation: TypedNavigation;
}

const propsTitle = 'KOMONDOR';
const propsLink = 'https://app.felfele.org/invite/6K7R+VpQMiuIyw9B0mCnS2cJDJ2P90I1kgSC+Qy3OSY=/A2SS5J_xnxXmxFwweTN4GJj1JK3bl62UAR4kWvL4FHLK/davidg';
const QRCodeWidth = Dimensions.get('screen').width * 0.6;

export const InviteWithQRCodeScreen = (props: DispatchProps & StateProps) => (
    <FragmentSafeAreaViewWithoutTabBar>
        <NavigationHeader
            title={propsTitle}
            navigation={props.navigation}
            leftButton={{
                label: <CloseIcon size={40} />,
                onPress: () => props.navigation.goBack(null),
            }}
        />
        <KeyboardAvoidingView
            style={styles.container}
            behavior='height'
        >
            <ScrollView style={styles.scrollContainer}>
                <BoldText style={styles.titleLabel}>Ask someone to scan this QR code</BoldText>
                <RegularText style={styles.subtitleLabel}>This is done using the camera on a connected device.</RegularText>
                <View style={styles.QRCodeContainer}>
                    <QRCode
                        value={propsLink}
                        size={QRCodeWidth}
                        color={Colors.BLACK}
                        backgroundColor={ComponentColors.BACKGROUND_COLOR}
                    />
                </View>
                <View style={styles.generateCodeButtonContainer}>
                    <View style={styles.generateCodePadding}></View>
                    <PrimaryButton
                        label='GENERATE NEW QR CODE'
                        onPress={() => {}}
                        style={styles.generateCodeButton}
                        enabled={false}
                    />
                    <View style={styles.generateCodePadding}>
                        <Icon name='hourglass_mid' size={20} color={Colors.GRAY} />
                        <RegularText style={styles.generateCodeTimerLabel}>30</RegularText>
                    </View>
                </View>

                <RegularText style={styles.linkUniqueLabel}>Each QR code is unique and can only be used once.</RegularText>
            </ScrollView>
            <FloatingButton
                iconName='check'
                iconSize={48}
                onPress={() => props.navigation.goBack(null)}
            />
        </KeyboardAvoidingView>
    </FragmentSafeAreaViewWithoutTabBar>
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        backgroundColor: ComponentColors.BACKGROUND_COLOR,
    },
    scrollContainer: {
        flex: 1,
        width: '100%',
    },
    titleLabel: {
        paddingTop: 18,
        fontSize: 18,
        alignSelf: 'center',
    },
    subtitleLabel: {
        paddingTop: 5,
        paddingBottom: 18,
        fontSize: 14,
        alignSelf: 'center',
    },
    QRCodeContainer: {
        alignSelf: 'center',
    },
    linkText: {
        fontSize: 18,
        color: Colors.DARK_GRAY,
        padding: 10,
    },
    generateCodeButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignSelf: 'center',
        alignItems: 'center',
        width: '80%',
        marginTop: 60,
    },
    generateCodePadding: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        width: 60,
        paddingLeft: 9,
    },
    generateCodeButton: {
        alignSelf: 'center',
        flex: 1,
    },
    generateCodeTimerLabel: {
        fontSize: 12,
        color: Colors.GRAY,
    },
    linkUniqueLabel: {
        fontSize: 14,
        color: Colors.LIGHTISH_GRAY,
        paddingTop: 9,
        alignSelf: 'center',
    },
});
