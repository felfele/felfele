import * as React from 'react';
import { View, Platform } from 'react-native';
import { DefaultTabBarHeight, ComponentColors } from '../../styles';

export const TabBarPlaceholder = (props: { color?: string }) => {
    if (Platform.OS === 'ios') {
        return (
            <View
                style={{
                    height: DefaultTabBarHeight + 20,
                    backgroundColor: props.color ? props.color : ComponentColors.BACKGROUND_COLOR,
                }}
            />
        );

    } else {
        return null;
    }
};
