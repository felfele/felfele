import * as React from 'react';
import { Colors } from '../../styles';
import {
    StyleSheet,
    Text,
    Switch,
    View,
    GestureResponderEvent,
    TouchableWithoutFeedback,
} from 'react-native';
import { TouchableView } from '../../components/TouchableView';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RegularText } from './text';

interface Props {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    onPress?: (event?: GestureResponderEvent) => void;
    onLongPress?: (event?: GestureResponderEvent) => void;
    onSwitchValueChange?: (value: boolean) => void;
    switchState?: boolean;
    switchDisabled?: boolean;
    buttonStyle: 'none' | 'switch' | 'navigate';
}

export const RowItem = React.memo((props: Props) => {
    switch (props.buttonStyle) {
        case 'navigate': {
            return <RowButton {...props}/>;
        }
        case 'switch': {
            return <RowSwitchButton {...props}/>;
        }
        case 'none': {
            return <RowButton {...props}/>;
        }
        default: {
            return null;
        }
    }
});

const RowButton = (props: Props) => {
    return (
        <TouchableWithoutFeedback
            style={styles.container}
            onPress={props.onPress}
            onLongPress={props.onLongPress}
        >
            <View style={styles.container}>
                {props.icon &&
                <RowIcon>
                    {props.icon}
                </RowIcon>
                }
                <RegularText style={styles.title}>{props.title}</RegularText>
                <View style={styles.rightContainer}>
                    {props.description &&
                    <RegularText style={styles.description}>{props.description}</RegularText>
                    }
                    {props.buttonStyle === 'navigate' &&
                    <Icon
                        name='chevron-right'
                        size={24}
                        color={Colors.DARK_GRAY}
                    />
                    }
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
};

const RowSwitchButton = (props: Props) => {
    return (
        <View style={styles.container}>
            {props.icon &&
            <RowIcon>
                {props.icon}
            </RowIcon>
            }
            <RegularText style={styles.title}>{props.title}</RegularText>
            {props.description &&
            <RegularText style={styles.description}>{props.description}</RegularText>
            }
            <Switch
                onValueChange={props.onSwitchValueChange}
                value={props.switchState}
                style={styles.rightContainer}
                disabled={props.switchDisabled}
            />
        </View>
    );
};

const RowIcon = (props: { children: React.ReactNode}) => (
    <View style={styles.rowIcon}>
        {props.children}
    </View>
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        backgroundColor: 'white',
        borderBottomColor: 'lightgray',
        borderBottomWidth: 1,
        paddingHorizontal: 10,
        height: 44,
    },
    title: {
        fontSize: 14,
        color: Colors.DARK_GRAY,
    },
    description: {
        fontSize: 14,
        color: Colors.LIGHTISH_GRAY,
    },
    rightContainer: {
        marginLeft: 'auto',
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowIcon: {
        paddingRight: 5,
        alignItems: 'center',
    },
});
