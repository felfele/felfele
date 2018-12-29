import * as React from 'react';
import { View, Text, StyleSheet, FlatList, Platform } from 'react-native';

import { NavigationHeader } from './NavigationHeader';
import { DateUtils } from '../DateUtils';
import { Colors } from '../styles';

export interface StateProps {
    currentTimestamp: number;
    navigation: any;
}

export interface DispatchProps {
    onTickTime: () => void;
}

export type Props = StateProps & DispatchProps;

type LogItem = [string, string];
const logData: LogItem[] = [];

export const appendToLog = (logLine: string) => {
    const dateString = DateUtils.timestampToDateString(Date.now(), true).replace('T', ' ').replace('Z', '');
    logData.splice(0, 0, [dateString, logLine]);
};

const clearLog = (props: Props) => {
    logData.splice(0, logData.length);
    props.onTickTime();
};

export const LogViewer = (props: Props) => {
    return (
        <View style={styles.mainContainer}>
            <NavigationHeader
                onPressLeftButton={() => props.navigation.goBack(null)}
                rightButtonText1='Clear'
                onPressRightButton1={() => clearLog(props)}
                title='Log viewer'
            />

            <FlatList
                data={logData}
                renderItem={({item, index}) => <View style={styles.logLineContainer}>
                        <Text style={styles.logTimeText}>{item[0]}</Text>
                        <Text style={styles.logText}>{item[1]}</Text>
                    </View>
                }
                keyExtractor={(item) => item[0]}
            />
        </View>
    );
};

const fontFamily = Platform.OS === 'ios' ? 'Courier' : 'monospace';
const styles = StyleSheet.create({
    mainContainer: {
        height: '100%',
    },
    logLineContainer: {
    },
    logTimeText: {
        fontFamily: fontFamily,
        paddingTop: 6,
        color: Colors.LIGHTISH_GRAY,
    },
    logText: {
        fontFamily: fontFamily,
        paddingTop: 6,
        color: Colors.DARK_GRAY,
    },
});
