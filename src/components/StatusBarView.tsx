import * as React from 'react';
import {
    StyleSheet,
    View,
    StatusBar,
    Platform,
    StatusBarProps,
} from 'react-native';

interface Props extends StatusBarProps {
    backgroundColor: string;
}

export const StatusBarView = (props: Props) => (
    <View style={[styles.statusBar, { backgroundColor: props.backgroundColor }]}>
        <StatusBar translucent backgroundColor={props.backgroundColor} {...props} />
    </View>
);

const majorVersionIOS = parseInt(Platform.Version as string, 10);
const STATUSBAR_HEIGHT = Platform.OS === 'ios'
    ? majorVersionIOS < 11 ? 20 : 0
    : 0;

const styles = StyleSheet.create({
    statusBar: {
        height: STATUSBAR_HEIGHT,
    },
});
