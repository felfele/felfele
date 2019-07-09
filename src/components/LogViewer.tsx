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
import { clearLog, filteredLog, setLogFilter } from '../log';
import { Colors, ComponentColors, DefaultTabBarHeight } from '../styles';
import { SimpleTextInput } from './SimpleTextInput';
import { TypedNavigation } from '../helpers/navigation';
import { FragmentSafeAreaViewWithoutTabBar } from '../ui/misc/FragmentSafeAreaView';

export interface StateProps {
    currentTimestamp: number;
    navigation: TypedNavigation;
}

export interface DispatchProps {
    onTickTime: () => void;
}

export type Props = StateProps & DispatchProps;

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
        <FragmentSafeAreaViewWithoutTabBar>
            <NavigationHeader
                navigation={this.props.navigation}
                rightButton1={{
                    label: 'Clear',
                    onPress: () => {
                        clearLog();
                        this.props.onTickTime();
                    },
                }}
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
                            onChangeText={(text) => {
                                setLogFilter(text.toLowerCase());
                                this.props.onTickTime();
                            }}
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
                keyExtractor={(item, index) => `${index}${item[0]}`}
            />
        </FragmentSafeAreaViewWithoutTabBar>
    )
}

const fontFamily = Platform.OS === 'ios' ? 'Courier' : 'monospace';
const styles = StyleSheet.create({
    logLineContainer: {
    },
    logFilterContainer: {
        height: 40,
        paddingHorizontal: 16,
        paddingVertical: 6,
        backgroundColor: ComponentColors.BACKGROUND_COLOR,
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
