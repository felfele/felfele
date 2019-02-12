import * as React from 'react';
import { View,
    Text,
    StyleSheet,
    FlatList,
    Platform,
    Dimensions,
} from 'react-native';
import Ionicon from 'react-native-vector-icons/Ionicons';

import { NavigationHeader } from './NavigationHeader';
import { DateUtils } from '../DateUtils';
import { Colors, DefaultTabBarHeight } from '../styles';
import { SimpleTextInput } from './SimpleTextInput';

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
let logFilter = '';

export const appendToLog = (logLine: string) => {
    const dateString = DateUtils.timestampToDateString(Date.now(), true).replace('T', ' ').replace('Z', '');
    logData.splice(0, 0, [dateString, logLine]);
};

const clearLog = (props: Props) => {
    logData.splice(0, logData.length);
    props.onTickTime();
};

const filteredLog = (): LogItem[] => {
    return logData
        .filter(logItem => logItem[1].indexOf('TIME-TICK') === -1)
        .filter(logItem => logItem[1].toLowerCase().indexOf(logFilter) !== -1 || logItem[0].indexOf(logFilter) !== -1)
        ;
};

export const getBugReportBody = (): string => {
    return filteredLog()
        .map((logItem: LogItem) => {
            return `${logItem[0]} ${logItem[1]}`;
        })
        .join('\n')
        ;
};

export class LogViewer extends React.PureComponent<Props> {
    private tickInterval: any = null;

    public componentDidMount = () => {
        this.tickInterval = setInterval(() => this.props.onTickTime(), 1000);
    }

    public componentWillUnmount = () => {
        clearInterval(this.tickInterval);
        this.tickInterval = null;
    }

    public render = () => (
        <View style={styles.mainContainer}>
            <NavigationHeader
                onPressLeftButton={() => this.props.navigation.goBack(null)}
                rightButtonText1='Clear'
                onPressRightButton1={() => clearLog(this.props)}
                title='Log viewer'
            />
            { Platform.OS === 'ios' &&
                <View style={styles.logFilterContainer}>
                    <View style={styles.logFilterTextInputContainer}>
                        <Ionicon name='md-search' size={28} color={Colors.LIGHT_GRAY} />
                        <SimpleTextInput
                            style={styles.logFilterTextInput}
                            autoCapitalize='none'
                            autoCorrect={false}
                            placeholder='Filter logs'
                            placeholderTextColor={Colors.LIGHT_GRAY}
                            onChangeText={(text) => (logFilter = text.toLowerCase()) && this.props.onTickTime()}
                        />
                    </View>
                </View>
            }
            <FlatList
                data={filteredLog()}
                renderItem={({item, index}) => <View style={styles.logLineContainer}>
                        <Text style={styles.logTimeText}>{item[0]}</Text>
                        <Text style={styles.logText}>{item[1]}</Text>
                    </View>
                }
                keyExtractor={(item) => item[0]}
            />
        </View>
    )
}

const fontFamily = Platform.OS === 'ios' ? 'Courier' : 'monospace';
const styles = StyleSheet.create({
    mainContainer: {
        height: Dimensions.get('window').height - DefaultTabBarHeight + 1,
        backgroundColor: Colors.BACKGROUND_COLOR,
    },
    logLineContainer: {
    },
    logFilterContainer: {
        height: 40,
        paddingHorizontal: 16,
        paddingVertical: 6,
        backgroundColor: Colors.BACKGROUND_COLOR,
    },
    logFilterTextInputContainer: {
        borderRadius: 16,
        height: 28,
        backgroundColor: Colors.WHITE,
        paddingHorizontal: 10,
        flexDirection: 'row',
    },
    logFilterTextInput: {
        fontSize: 14,
        height: 28,
        color: Colors.GRAY,
        backgroundColor: Colors.WHITE,
        paddingLeft: 10,
        flex: 1,
    },
    logFilterTextInputDeleteContainer: {
        width: 24,
        padding: 0,
        paddingTop: 2,
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
