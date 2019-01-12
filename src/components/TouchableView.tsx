import * as React from 'react';
import { View, TouchableWithoutFeedback } from 'react-native';

export const TouchableViewDefaultHitSlop = {
    top: 20,
    left: 30,
    bottom: 20,
    right: 30,
};

export const TouchableView = (props) => (
    <TouchableWithoutFeedback
        onPress={props.onPress}
        onLongPress={props.onLongPress}
        hitSlop={props.hitSlop ? props.hitSlop : TouchableViewDefaultHitSlop}
    >
        <View {...props} >
            {props.children}
        </View>
    </TouchableWithoutFeedback>
);
