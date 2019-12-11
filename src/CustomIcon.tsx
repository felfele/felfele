import * as React from 'react';
import { View } from 'react-native';
import {createIconSetFromIcoMoon} from 'react-native-vector-icons';
import icoMoonConfig from '../icomoon.json';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from './styles';

export const Icon = createIconSetFromIcoMoon(icoMoonConfig);
export default Icon;
// export default Icon;

export const CloseIcon = (props: {size: number, color?: string}) => (
    <View style={{
        width: props.size,
        height: props.size,
    }}>
        <Icon
            name='arrow1_close'
            size={props.size}
            color={props.color != null ? props.color : Colors.BLACK}
        />
    </View>
);
