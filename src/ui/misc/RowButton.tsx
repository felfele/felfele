import * as React from 'react';
import { Colors } from '../../styles';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { TouchableView } from '../../components/TouchableView';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Props {
    label: string;
    navigate?: boolean;
    onPress?: () => void;
}

export const RowButton = (props: Props) => {
    return (
        <TouchableView style={styles.container} onPress={props.onPress}>
            <Text style={styles.text}>{props.label}</Text>
            {props.navigate &&
                <Icon
                    name='chevron-right'
                    size={24}
                    color={Colors.DARK_GRAY}
                />
            }
        </TouchableView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        backgroundColor: 'white',
        borderBottomColor: 'lightgray',
        borderBottomWidth: 1,
        borderTopColor: 'lightgray',
        borderTopWidth: 1,
        paddingVertical: 14,
        paddingHorizontal: 10,
    },
    text: {
        fontSize: 14,
        color: Colors.DARK_GRAY,
    },
});
