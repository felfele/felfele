import * as React from 'react';
import { StyleSheet, KeyboardAvoidingView, View, ScrollView, Dimensions, TextInput } from 'react-native';
import { FragmentSafeAreaViewWithoutTabBar } from '../../misc/FragmentSafeAreaView';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { FloatingButton } from '../../misc/FloatingButton';
import { TypedNavigation } from '../../../helpers/navigation';
import Icon, { CloseIcon } from '../../../CustomIcon';
import { RegularText, BoldText } from '../../misc/text';
import { Colors, ComponentColors, DefaultNavigationBarHeight } from '../../../styles';
import { PrimaryButton, Button } from '../../misc/Button';

interface DispatchProps {
}

interface StateProps {
    navigation: TypedNavigation;
}

const propsTitle = 'KOMONDOR';
const propsContactName = 'Attila';

const profilePictureSize = Dimensions.get('screen').width * 0.6;

export const InviteContactScreen = (props: DispatchProps & StateProps) => (
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
            keyboardVerticalOffset={DefaultNavigationBarHeight}
            behavior='height'
        >
            <ScrollView style={styles.scrollContainer}>
                <BoldText style={styles.titleLabel}>Invite contact</BoldText>
                <RegularText style={styles.subtitleLabel}>This person will be able to view and post content.</RegularText>
                <View style={styles.profilePictureContainer}>
                </View>
                <BoldText style={styles.nameLabel}>{propsContactName}</BoldText>
                <View style={styles.invitationTextContainer}>
                    <RegularText style={styles.invitationTextLabel}>Invitation message (tap to change)</RegularText>
                    <TextInput
                        defaultValue={`Hey there, I'd love you to join this page`}
                        style={styles.invitationTextInput}
                    />
                </View>
                <View style={styles.changedYourMindContainer}>
                    <RegularText style={styles.changedYourMindLabel}>Changed your mind?</RegularText>
                    <Button label={`DON'T INVITE`} onPress={() => props.navigation.goBack(null)} />
                </View>
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
    profilePictureContainer: {
        alignSelf: 'center',
        backgroundColor: '#FF9FED',
        width: profilePictureSize,
        height: profilePictureSize,
        borderRadius: profilePictureSize / 2,
    },
    nameLabel: {
        paddingTop: 21,
        paddingBottom: 18,
        fontSize: 18,
        color: Colors.BLACK,
        alignSelf: 'center',
    },
    invitationTextContainer: {
        padding: 18,
        width: '100%',
        height: 140,
        backgroundColor: Colors.WHITE,
        borderBottomColor: Colors.BLACK + '33',
        borderBottomWidth: 1,
    },
    invitationTextLabel: {
        fontSize: 12,
        color: Colors.GRAY,
    },
    invitationTextInput: {
        paddingTop: 9,
        fontSize: 18,
    },
    changedYourMindContainer: {
        padding: 9,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    changedYourMindLabel: {
        fontSize: 14,
        color: Colors.GRAY,
    },
});
