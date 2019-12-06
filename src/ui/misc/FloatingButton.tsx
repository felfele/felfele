import * as React from 'react';
import { View, StyleSheet } from 'react-native';

import Icon from '../../CustomIcon';
import { DefaultTabBarHeight, Colors } from '../../styles';
import { TouchableView } from '../../components/TouchableView';

interface Props {
    onPress: () => void;
    iconName: string;
    iconSize: number;
}

export const FloatingButton = (props: Props) => (
    <View style={styles.floatingButtonContainer}>
        <TouchableView style={styles.floatingButton} onPress={props.onPress}>
            <Icon name={props.iconName} size={props.iconSize} />
        </TouchableView>
    </View>
);

const styles = StyleSheet.create({
    floatingButtonContainer: {
        width: '100%',
        height: 60,
        position: 'absolute',
        bottom: 11 + DefaultTabBarHeight + 30,
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
        backgroundColor: Colors.WHITE,
        borderRadius: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
