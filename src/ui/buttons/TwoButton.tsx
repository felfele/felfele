import * as React from 'react';
import {
    GestureResponderEvent,
    TouchableWithoutFeedback,
    StyleSheet,
    View,
    Text,
    StyleProp,
    ViewStyle,
} from 'react-native';
import { Colors } from '../../styles';

interface Props {
    leftButton: ButtonProps;
    rightButton: ButtonProps;
}

interface ButtonProps {
    label?: string;
    icon?: React.ReactNode;
    onPress?: (event?: GestureResponderEvent) => void;
    style?: StyleProp<ViewStyle>;
}

export const TwoButton = (props: Props) => {
    return (
        <View style={{ flexDirection: 'row' }}>
            <Button {...props.leftButton} style={{ marginRight: 5 }}/>
            <Button {...props.rightButton} style={{ marginLeft: 5 }}/>
        </View>
    );
};

const Button = (props: ButtonProps) => {
    return (
        <TouchableWithoutFeedback onPress={props.onPress}>
            <View style={[styles.mainContainer, props.style]}>
                <View style={styles.container}>
                    <View style={styles.icon}>{props.icon}</View>
                    <Text style={styles.label}>{props.label}</Text>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: Colors.WHITE,
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
        fontSize: 12,
        color: Colors.BRAND_PURPLE,
    },
    icon: {
        alignItems: 'center',
        paddingRight: 6,
        paddingVertical: 5,
    },
});
