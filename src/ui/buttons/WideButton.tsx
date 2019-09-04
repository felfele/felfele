import * as React from 'react';
import {
    TouchableWithoutFeedback,
    StyleSheet,
    View,
} from 'react-native';
import { Colors } from '../../styles';
import { MediumText } from '../misc/text';
import { ButtonProps } from './TwoButton';

export const WideButton = (props: ButtonProps) => {
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
        flexDirection: 'row',
        backgroundColor: Colors.WHITE,
        margin: 10,
        height: 44,
    },
    container: {
        flex: 1,
        flexDirection: 'row',
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
    },
});
