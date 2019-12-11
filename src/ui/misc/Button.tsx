import * as React from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';

import { TouchableView } from '../../components/TouchableView';
import { BoldText } from './text';
import { Colors } from '../../styles';

export const Button = (props: {label: string, onPress: () => void, style?: StyleProp<ViewStyle>}) => (
    <TouchableView style={[styles.buttonContainer, props.style]} onPress={props.onPress}>
        <BoldText style={styles.buttonLabel}>{props.label}</BoldText>
    </TouchableView>
);

const styles = StyleSheet.create({
    buttonContainer: {
        backgroundColor: Colors.BLACK,
        height: 25,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonLabel: {
        paddingHorizontal: 10,
        color: Colors.WHITE,
        fontSize: 12,
    },
});
