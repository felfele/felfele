import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Colors, DefaultNavigationBarHeight } from '../styles';
import { TouchableView, TouchableViewDefaultHitSlop } from './TouchableView';
import { MediumText, RegularText } from '../ui/misc/text';
import { TypedNavigation } from '../helpers/navigation';

interface HeaderButton {
    label: string | React.ReactNode;
    onPress: () => void;
}

interface HeaderProps {
    leftButton?: HeaderButton;
    rightButton1?: HeaderButton;
    rightButton2?: HeaderButton;
    title?: string;
    titleImage?: React.ReactNode;
    onPressTitle?: () => void;
    navigation?: TypedNavigation;
}

export type Props = HeaderProps;

const BUTTON_COLOR = Colors.DARK_GRAY;

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
                <RightButton onPress={props.rightButton1.onPress} text={props.rightButton1.label} />}
            {props.rightButton2 &&
                <View style={{paddingRight: 20}}>
                    <RightButton onPress={props.rightButton2.onPress} text={props.rightButton2.label} />
                </View>
            }
        </View>
    </View>
);

const RightButton = (props: { onPress?: () => void, text?: string | React.ReactNode }) => {
    return (
        <TouchableView
            onPress={props.onPress}
            testID={'NavigationHeader/RightButton'}
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
        borderBottomWidth: 1,
        borderBottomColor: Colors.LIGHT_GRAY,
        backgroundColor: Colors.WHITE,
    },
    headerLeftButtonText: {
        color: BUTTON_COLOR,
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
        color: Colors.DARK_GRAY,
        textAlign: 'center',
    },
    headerRightButtonText: {
        fontSize: 18,
        color: BUTTON_COLOR,
    },
    rightButtonContainer: {
        marginLeft: 30,
    },
});
