import * as React from 'react';
import { View } from 'react-native';
import { DefaultTabBarHeight, Colors } from '../../styles';

export const TabBarPlaceholder = (props: { color?: string }) => (
    <View
        style={{
            height: DefaultTabBarHeight,
            backgroundColor: props.color ? props.color : Colors.BACKGROUND_COLOR,
        }}
    />
);
