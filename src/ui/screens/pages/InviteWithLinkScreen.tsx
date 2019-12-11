import * as React from 'react';
import { StyleSheet, KeyboardAvoidingView, View, ScrollView } from 'react-native';
import { FragmentSafeAreaViewWithoutTabBar } from '../../misc/FragmentSafeAreaView';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { FloatingButton } from '../../misc/FloatingButton';
import { TypedNavigation } from '../../../helpers/navigation';
import { CloseIcon } from '../../../CustomIcon';
import { RegularText, BoldText } from '../../misc/text';
import { Colors, ComponentColors, DefaultNavigationBarHeight } from '../../../styles';
import { PrimaryButton } from '../../misc/Button';

interface DispatchProps {
}

interface StateProps {
    navigation: TypedNavigation;
}

const propsTitle = 'KOMONDOR';
const propsLink = 'https://app.felfele.org/invite/6K7R+VpQMiuIyw9B0mCnS2cJDJ2P90I1kgSC+Qy3OSY=/A2SS5J_xnxXmxFwweTN4GJj1JK3bl62UAR4kWvL4FHLK/davidg';

export const InviteWithLinkScreen = (props: DispatchProps & StateProps) => (
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
                <BoldText style={styles.titleLabel}>Share this link with someone you know</BoldText>
                <RegularText style={styles.subtitleLabel}>Copy/paste or share this link via chat, email, SMS, etc.</RegularText>
                <View style={styles.linkContainer}>
                    <RegularText style={styles.linkText}>{propsLink}</RegularText>
                </View>
                <PrimaryButton
                    label='SHARE LINK'
                    onPress={() => {}}
                    style={styles.shareLinkButton}
                />
                <RegularText style={styles.linkUniqueLabel}>Each link is unique and can only be used once.</RegularText>
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
    linkContainer: {
        alignSelf: 'center',
        width: 220,
        height: 220,
        borderWidth: 1,
        borderColor: Colors.LIGHT_GRAY,
    },
    linkText: {
        fontSize: 18,
        color: Colors.DARK_GRAY,
        padding: 10,
    },
    shareLinkButton: {
        alignSelf: 'center',
        marginTop: 60,
    },
    linkUniqueLabel: {
        fontSize: 14,
        color: Colors.LIGHTISH_GRAY,
        paddingTop: 9,
        alignSelf: 'center',
    },
});
