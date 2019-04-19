import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Colors, ComponentColors, DefaultNavigationBarHeight } from '../styles';
import { TouchableView, TouchableViewDefaultHitSlop } from './TouchableView';
import { MediumText, RegularText } from '../ui/misc/text';
import { TypedNavigation } from '../helpers/navigation';

export interface ButtonProps {
    label: string | React.ReactNode;
    onPress: () => void;
    testID?: string;
}

interface HeaderProps {
    leftButton?: ButtonProps;
    rightButton1?: ButtonProps;
    rightButton2?: ButtonProps;
    title?: string;
    titleImage?: React.ReactNode;
    onPressTitle?: () => void;
    navigation?: TypedNavigation;
}

export type Props = HeaderProps;

const BUTTON_COLOR = Colors.WHITE;

export const HeaderDefaultLeftButtonIcon = <Icon name={'arrow-left'} color={BUTTON_COLOR} size={24} />;

export const NavigationHeader = (props: Props) => (
    <View style={styles.headerContainer}>
        <TouchableView onPress={
                props.leftButton != null
                    ? props.leftButton.onPress
                    : props.navigation != null
                        ? () => props.navigation!.goBack(null)
                        : undefined
            }
            style={styles.leftContainer}
            testID={(props.leftButton && props.leftButton.testID) || 'NavigationHeader/LeftButton'}
        >
            <RegularText style={styles.headerLeftButtonText}>
                {
                    props.leftButton != null
                        ? props.leftButton.label
                        : props.navigation != null
                            ? HeaderDefaultLeftButtonIcon
                            : undefined
                }
            </RegularText>
        </TouchableView>
        <TouchableView onPress={props.onPressTitle} style={styles.middleContainer}>
            {props.titleImage}
            <MediumText
                style={styles.titleText}
                ellipsizeMode='tail'
                numberOfLines={1}
            >
                {props.title ? props.title : ''}
            </MediumText>
        </TouchableView>
        <View style={styles.rightContainer}>
            {props.rightButton1 &&
                <RightButton
                    onPress={props.rightButton1.onPress}
                    text={props.rightButton1.label}
                    testID={props.rightButton1.testID || 'NavigationHeader/RightButton1'}
                />}
            {props.rightButton2 &&
                <View style={{paddingRight: 20}}>
                    <RightButton
                        onPress={props.rightButton2.onPress}
                        text={props.rightButton2.label}
                        testID={props.rightButton2.testID || 'NavigationHeader/RightButton2'}
                    />
                </View>
            }
        </View>
    </View>
);

const RightButton = (props: { onPress?: () => void, text?: string | React.ReactNode, testID?: string }) => {
    return (
        <TouchableView
            onPress={props.onPress}
            testID={props.testID}
            style={styles.rightButtonContainer}
            hitSlop={{...TouchableViewDefaultHitSlop, left: 10}}
        >
            <RegularText style={styles.headerRightButtonText}>
                {props.text ? props.text : ''}
            </RegularText>
        </TouchableView>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        height: DefaultNavigationBarHeight,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 2,
        borderBottomWidth: 0,
        borderBottomColor: Colors.LIGHT_GRAY,
        backgroundColor: ComponentColors.HEADER_COLOR,
    },
    headerLeftButtonText: {
        color: Colors.WHITE,
        fontSize: 18,
    },
    leftContainer: {
        flex: 1,
    },
    middleContainer: {
        maxWidth: '50%',
        flexDirection: 'row',
        alignItems: 'center',
    },
    rightContainer: {
        flex: 1,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    titleText: {
        fontSize: 15,
        color: Colors.WHITE,
        textAlign: 'center',
    },
    headerRightButtonText: {
        fontSize: 18,
        color: Colors.WHITE,
    },
    rightButtonContainer: {
        marginLeft: 30,
    },
});
