import * as React from 'react';
import { View, StyleSheet } from 'react-native';

import Icon from '../../CustomIcon';
import { DefaultTabBarHeight, Colors } from '../../styles';
import { TouchableView } from '../../components/TouchableView';

interface Props {
    onPress: () => void;
    iconName: string;
    iconSize: number;
    enabled?: boolean;
    extraBottom?: number;
}

const isDisabled = (enabled?: boolean) => enabled != null && enabled === false;

const buttonStyle = (enabled?: boolean) => isDisabled(enabled)
    ? styles.floatingButtonDisabled
    : styles.floatingButtonEnabled
;

const iconColor = (enabled?: boolean) => isDisabled(enabled)
    ? Colors.BLACK + '4D'
    : Colors.BLACK
;

const DEFAULT_BOTTOM_STYLE = 40;
const extraBottomStyle = (extraBottom?: number) => extraBottom != null
    ? {
        bottom: extraBottom + DEFAULT_BOTTOM_STYLE,
    }
    : undefined
;

export const FloatingButton = (props: Props) => (
    <View style={[styles.floatingButtonContainer, extraBottomStyle(props.extraBottom)]}>
        <TouchableView style={[styles.floatingButton, buttonStyle(props.enabled)]} onPress={props.onPress}>
            <Icon name={props.iconName} size={props.iconSize} color={iconColor(props.enabled)} />
        </TouchableView>
    </View>
);

const styles = StyleSheet.create({
    floatingButtonContainer: {
        width: '100%',
        height: 60,
        position: 'absolute',
        bottom: DEFAULT_BOTTOM_STYLE,
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: Colors.BLACK,
        shadowOpacity: 0.2,
        shadowRadius: 0.5,
        shadowOffset: {
            width: 0,
            height: 0.5,
        },
    },
    floatingButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    floatingButtonEnabled: {
        backgroundColor: Colors.WHITE,
    },
    floatingButtonDisabled: {
        backgroundColor: Colors.VERY_LIGHT_GRAY,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: Colors.BLACK + '33',
    },
});
