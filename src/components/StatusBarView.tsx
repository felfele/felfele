import * as React from 'react';
import {
    StyleSheet,
    View,
    StatusBar,
    Platform,
} from 'react-native';

export const StatusBarView = ({ backgroundColor, ...props }) => (
    <View style={[styles.statusBar, { backgroundColor }]}>
        <StatusBar translucent backgroundColor={backgroundColor} {...props} />
    </View>
);

const majorVersionIOS = parseInt(Platform.Version as string, 10);
const STATUSBAR_HEIGHT = Platform.OS === 'ios'
    ? majorVersionIOS < 11 ? 20 : 0
    : StatusBar.currentHeight;

const styles = StyleSheet.create({
    statusBar: {
        height: STATUSBAR_HEIGHT,
    },
});
