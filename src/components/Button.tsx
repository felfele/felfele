import * as React from 'react';
import { Text, StyleSheet, ViewProperties } from 'react-native';
import { TouchableView } from './TouchableView';
import { BUTTON_COLOR, Colors } from '../styles';

export interface StateProps extends ViewProperties {
    text?: string | React.ReactNode;
    enabled?: boolean;
}

export interface DispatchProps {
    onPress?: () => void;
}

export type Props = StateProps & DispatchProps;

export interface State {
}

export const Button = (props: Props) => {
    const isButtonEnabled = props.enabled != null
                                ? props.enabled
                                : true;
    const buttonColor = isButtonEnabled ? BUTTON_COLOR : Colors.LIGHT_GRAY;
    return (
        <TouchableView
            onPress={isButtonEnabled ? props.onPress : undefined}
            style={styles.buttonContainer}
            {...props}
        >
            <Text style={[styles.buttonText, {color: buttonColor}]}>
                {props.text ? props.text : ''}
            </Text>
        </TouchableView>
    );
};

const styles = StyleSheet.create({
    buttonContainer: {
        height: 40,
    },
    buttonText: {
        fontSize: 18,
        color: BUTTON_COLOR,
    },
});
