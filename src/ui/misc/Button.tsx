import * as React from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';

import { TouchableView } from '../../components/TouchableView';
import { BoldText, RegularText } from './text';
import { Colors } from '../../styles';

interface Props {
    label: string;
    onPress: () => void;
    style?: StyleProp<ViewStyle>;
    enabled?: boolean;
}

const isEnabled = (enabled?: boolean) => enabled == null || enabled === true;

const buttonStyle = (enabled?: boolean) => isEnabled(enabled)
    ? styles.buttonContainerEnabled
    : styles.buttonContainerDisabled
;

export const Button = (props: Props) => (
    <TouchableView style={[styles.buttonContainer, buttonStyle(props.enabled), props.style]} onPress={props.onPress}>
        {
            isEnabled(props.enabled)
            ? <BoldText style={[styles.buttonLabel, styles.buttonLabelEnabled]}>{props.label}</BoldText>
            : <RegularText style={[styles.buttonLabel, styles.buttonLabelDisabled]}>{props.label}</RegularText>
        }
    </TouchableView>
);

const styles = StyleSheet.create({
    buttonContainer: {
        height: 25,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContainerEnabled: {
        backgroundColor: Colors.BLACK,
    },
    buttonContainerDisabled: {
        backgroundColor: Colors.VERY_LIGHT_GRAY,
        borderWidth: 1,
        borderColor: Colors.LIGHT_GRAY,
    },
    buttonLabel: {
        paddingHorizontal: 10,
        fontSize: 12,
    },
    buttonLabelEnabled: {
        color: Colors.WHITE,
    },
    buttonLabelDisabled: {
        color: Colors.BLACK,
    },
});
