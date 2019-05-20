import * as React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Colors, ComponentColors, DefaultNavigationBarHeight } from '../styles';
import { TouchableView, TouchableViewDefaultHitSlop } from './TouchableView';
import { MediumText, RegularText } from '../ui/misc/text';
import { TypedNavigation } from '../helpers/navigation';

export interface ButtonProps {
    label: string | React.ReactNode;
    onPress: () => void;
    disabled?: boolean;
    testID?: string;
}

interface HeaderProps {
    leftButton?: ButtonProps;
    rightButton1?: ButtonProps;
    rightButton2?: ButtonProps;
    title?: string;
    titleImage?: React.ReactNode;
    onPressTitle?: () => void;
    onLongPressTitle?: () => void;
    navigation?: TypedNavigation;
    style?: StyleProp<ViewStyle>;
}

export type Props = HeaderProps;

const BUTTON_COLOR = Colors.WHITE;

export const HeaderDefaultLeftButtonIcon = <Icon name={'arrow-left'} color={BUTTON_COLOR} size={24} />;

export const NavigationHeader = (props: Props) => (
    <View style={[styles.headerContainer, props.style]}>
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
            <ButtonLabel label={
                    props.leftButton != null
                        ? props.leftButton.label
                        : props.navigation != null
                            ? HeaderDefaultLeftButtonIcon
                            : undefined
                }
            />
        </TouchableView>
        <TouchableView
            onPress={props.onPressTitle}
            onLongPress={props.onLongPressTitle}
            style={styles.middleContainer}
        >
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
                    label={props.rightButton1.label}
                    testID={props.rightButton1.testID || 'NavigationHeader/RightButton1'}
                />}
            {props.rightButton2 &&
                <View style={{paddingRight: 10}}>
                    <RightButton
                        onPress={props.rightButton2.onPress}
                        label={props.rightButton2.label}
                        testID={props.rightButton2.testID || 'NavigationHeader/RightButton2'}
                    />
                </View>
            }
        </View>
    </View>
);

const ButtonLabel = (props: { label?: string | React.ReactNode }) => {
    return typeof props.label === 'string'
        ? <RegularText style={styles.headerButtonText}>
                {props.label}
            </RegularText>
        : <View>{props.label}</View>
    ;
};

const RightButton = (props: { onPress?: () => void, label?: string | React.ReactNode, testID?: string }) => {
    return (
        <TouchableView
            onPress={props.onPress}
            testID={props.testID}
            style={styles.rightButtonContainer}
            hitSlop={{...TouchableViewDefaultHitSlop, left: 10}}
        >
            <ButtonLabel label={props.label} />
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
        backgroundColor: ComponentColors.HEADER_COLOR,
        zIndex: 100,
    },
    headerButtonText: {
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
    rightButtonContainer: {
        marginLeft: 20,
    },
});
