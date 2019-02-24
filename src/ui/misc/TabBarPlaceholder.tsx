import * as React from 'react';
import { View, Platform } from 'react-native';
import { DefaultTabBarHeight, Colors } from '../../styles';

export const TabBarPlaceholder = (props: { color?: string }) => {
    if (Platform.OS === 'ios') {
        return (
            <View
                style={{
                    height: DefaultTabBarHeight,
                    backgroundColor: props.color ? props.color : Colors.BACKGROUND_COLOR,
                }}
            />
        );

    } else {
        return null;
    }
};
