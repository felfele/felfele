import * as React from 'react';
import { View, TouchableWithoutFeedback, TouchableWithoutFeedbackProps } from 'react-native';

export const TouchableViewDefaultHitSlop = {
    top: 20,
    left: 30,
    bottom: 20,
    right: 30,
};

interface TouchableViewProps extends TouchableWithoutFeedbackProps {
    children: React.ReactNode;
}

export const TouchableView = (props: TouchableViewProps) => (
    <TouchableWithoutFeedback
        onPress={props.onPress}
        onLongPress={props.onLongPress}
        hitSlop={props.hitSlop ? props.hitSlop : TouchableViewDefaultHitSlop}
        testID={props.testID}
    >
        <View {...props} >
            {props.children}
        </View>
    </TouchableWithoutFeedback>
);
