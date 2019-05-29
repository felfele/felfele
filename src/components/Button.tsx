import * as React from 'react';
import { StyleSheet, ViewProperties } from 'react-native';
import { TouchableView } from './TouchableView';
import { ComponentColors } from '../styles';
import { RegularText } from '../ui/misc/text';

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
    const buttonColor = isButtonEnabled ? ComponentColors.BUTTON_COLOR : ComponentColors.DISABLED_BUTTON_COLOR;
    return (
        <TouchableView
            onPress={isButtonEnabled ? props.onPress : undefined}
            style={styles.buttonContainer}
            {...props}
        >
            <RegularText style={[styles.buttonText, {color: buttonColor}]}>
                {props.text ? props.text : ''}
            </RegularText>
        </TouchableView>
    );
};

const styles = StyleSheet.create({
    buttonContainer: {
        height: 40,
    },
    buttonText: {
        fontSize: 18,
        color: ComponentColors.BUTTON_COLOR,
    },
});
