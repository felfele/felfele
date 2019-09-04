import * as React from 'react';
import {
    GestureResponderEvent,
    TouchableWithoutFeedback,
    StyleSheet,
    View,
    StyleProp,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { Colors, ComponentColors } from '../../styles';
import { MediumText } from '../misc/text';

interface Props {
    leftButton: ButtonProps;
    rightButton: ButtonProps;
}

export interface ButtonProps {
    label?: string;
    icon?: React.ReactNode;
    onPress?: (event?: GestureResponderEvent) => void;
    style?: StyleProp<ViewStyle>;
    fontStyle?: StyleProp<TextStyle>;
}

export const TwoButton = (props: Props) => {
    const { style: leftButtonStyle, ...leftButtonProps } = props.leftButton;
    const { style: rightButtonStyle, ...rightButtonProps } = props.rightButton;
    return (
        <View style={{ flexDirection: 'row' }}>
            <Button {...leftButtonProps} style={[{ marginRight: 5 }, leftButtonStyle]}/>
            <Button {...rightButtonProps} style={[{ marginLeft: 5 }, rightButtonStyle]}/>
        </View>
    );
};

const Button = (props: ButtonProps) => {
    return (
        <TouchableWithoutFeedback onPress={props.onPress}>
            <View style={[styles.mainContainer, props.style]}>
                <View style={styles.container}>
                    <View style={styles.icon}>{props.icon}</View>
                    <MediumText style={[styles.label, props.fontStyle]}>{props.label}</MediumText>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: ComponentColors.PRIMARY_RECTANGULAR_BUTTON_COLOR,
        margin: 10,
        height: 70,
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 14,
        color: Colors.BRAND_PURPLE,
    },
    icon: {
        alignItems: 'center',
        paddingRight: 6,
        paddingVertical: 5,
    },
});
