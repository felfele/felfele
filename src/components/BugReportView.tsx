import * as React from 'react';
import { NavigationHeader } from './NavigationHeader';
import { Colors, ComponentColors } from '../styles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    Platform,
    Text,
    ScrollView,
    KeyboardAvoidingView,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { restartApp } from '../helpers/restart';
import { BoldText, RegularText } from '../ui/misc/text';
import { filteredLog, LogItem } from '../log';
import { Version } from '../Version';

import { Debug } from '../Debug';
import { TypedNavigation } from '../helpers/navigation';
import { SimpleTextInput } from './SimpleTextInput';
import { WideButton } from '../ui/buttons/WideButton';
import { FragmentSafeAreaViewWithoutTabBar, FragmentSafeAreaViewForTabBar } from '../ui/misc/FragmentSafeAreaView';
import { TabBarPlaceholder } from '../ui/misc/TabBarPlaceholder';
import { TwoButton } from '../ui/buttons/TwoButton';

// personally identifiable information
export const PIIKeys = [ 'privateKey', 'publicKey', 'address', 'name', 'localPath', 'user' ];

export const escapePII = (text: string, filterFields: string[]): string => {
    const fieldsToEscape = filterFields
        .join('|');
    const quoteOrLineEnd = '("|$)';
    const fieldRegexp = new RegExp(`"(${fieldsToEscape})":".+?${quoteOrLineEnd}`, 'g');
    const localPathRegexp = new RegExp(`"(file:///.+?|/.+?/.+?)${quoteOrLineEnd}`, 'g');
    const bzzFeedRegexp = new RegExp(`(".*?)(bzz-feed:/.+?)${quoteOrLineEnd}`, 'g');
    return text
        .replace(fieldRegexp, '"$1":"OMITTED"')
        .replace(localPathRegexp, '"OMITTED"')
        .replace(bzzFeedRegexp, '$1OMITTED"')
        ;
};

const deviceInfo = () => {
    const brand = DeviceInfo.getBrand();
    const deviceID = DeviceInfo.getDeviceId();
    const country = DeviceInfo.getDeviceCountry();
    const locale = DeviceInfo.getDeviceLocale();
    const version = Version;
    const systemName = DeviceInfo.getSystemName();
    const systemVersion = DeviceInfo.getSystemVersion();

    return `
System: ${systemName} ${systemVersion} (${brand} ${deviceID})
Locale: ${locale} ${country}
Version: ${version}
`;
};

const piiFilteredLog = () => {
    return filteredLog()
        .map((logItem: LogItem) => {
            return `${logItem[0]} ${escapePII(logItem[1], PIIKeys)}`;
        })
        .join('\n')
        ;
};

interface Props {
    navigation?: TypedNavigation;
    errorView: boolean;
}

interface State {
    isSending: boolean;
    feedbackText: string;
}

export const BugReportViewWithTabBar = (props: Props) => (
    <FragmentSafeAreaViewForTabBar>
        <BugReportView {...props}/>
    </FragmentSafeAreaViewForTabBar>
);

export const BugReportViewWithoutTabBar = (props: Props) => (
    <FragmentSafeAreaViewWithoutTabBar>
        <BugReportView {...props}/>
    </FragmentSafeAreaViewWithoutTabBar>
);

class BugReportView extends React.Component<Props, State> {
    public state: State = {
        isSending: false,
        feedbackText: '',
    };

    public render() {
        return (
            <KeyboardAvoidingView style={styles.keyboardAvoidingContainer}>
                <NavigationHeader
                    navigation={this.props.navigation}
                    title='Bug Report'
                />
                <ScrollView contentContainerStyle={styles.contentContainer}>
                    <View style={styles.iconContainer}>
                        <Icon
                            name={'bug'}
                            size={36}
                            color={Colors.BLACK}
                        />
                    </View>
                    {this.props.errorView &&
                    <BoldText style={[styles.text, { fontSize: 18 }]}>
                        Yikes!{'\n\n'}
                        We are sorry, an error has occurred.{'\n'}
                    </BoldText>
                    }
                    <RegularText style={[styles.text, { fontSize: 14 }]} textBreakStrategy='simple'>
                        As we never collect information automatically, it would be truly helpful if you could take a moment to let us know what happened.
                    </RegularText>
                    <SimpleTextInput
                        style={styles.textInput}
                        multiline={true}
                        numberOfLines={4}
                        onChangeText={this.onChangeText}
                        placeholder='Let us know what happened...'
                        placeholderTextColor='gray'
                        underlineColorAndroid='transparent'
                    />
                    {!this.props.errorView
                        ? <this.SendBugReportButton/>
                        : <TwoButton
                            leftButton={{
                                icon:
                                    <Icon
                                        name={'refresh'}
                                        size={24}
                                        color={Colors.BRAND_PURPLE}
                                    />
                                ,
                                label: 'RESTART',
                                onPress: restartApp,
                            }}
                            rightButton={{
                                icon: !this.state.isSending ?
                                    <Icon
                                        name={'send'}
                                        size={24}
                                        color={Colors.BRAND_PURPLE}
                                    /> :
                                    <ActivityIndicator size='small' color='grey' />
                                ,
                                label: 'SEND BUG REPORT',
                                onPress: this.onPressSend,
                            }}
                        />
                    }
                    <RegularText style={[styles.text, { fontSize: 14, color: Colors.BRAND_PURPLE }]}>
                        By sending a bug report, you will share some information (shown below) with us.
                    </RegularText>
                    <View style={styles.logContainer}>
                        <Text style={styles.logText}>{this.getDeviceInfoAndLogs()}</Text>
                    </View>
                    <this.SendBugReportButton/>
                    <TabBarPlaceholder/>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    private SendBugReportButton = () => (
        <WideButton
            style={{marginBottom: 20}}
            icon={!this.state.isSending ?
                <Icon
                    name={'send'}
                    size={24}
                    color={Colors.BRAND_PURPLE}
                /> :
                <ActivityIndicator size='small' color='grey' />
            }
            onPress={this.onPressSend}
            label={'SEND BUG REPORT'}
        />
    )

    private onChangeText = (feedbackText: string) => {
        this.setState({ feedbackText });
    }

    private onPressSend = async () => {
        this.setState({
            isSending: true,
        });

        await this.sendBugReport();

        this.setState({
            isSending: false,
            feedbackText: '',
        });

        if (this.props.navigation != null) {
            this.props.navigation.goBack();
        } else if (this.props.errorView) {
            restartApp();
        }
    }

    private getBugReportBody = (): string => {
        return `User Feedback:

${this.state.feedbackText}
${this.getDeviceInfoAndLogs()}
`;
    }

    private getDeviceInfoAndLogs = (): string => {
        const bugReportBody = `Device Info:

${deviceInfo()}
Logs:

${piiFilteredLog()}`;
        return bugReportBody;
    }

    private sendBugReport = async () => {
        try {
            const response = await fetch('https://app.felfele.com/api/v1/bugreport/', {
                headers: {
                    'Content-Type': 'text/plain',
                },
                method: 'POST',
                body: this.getBugReportBody(),
            });
            Debug.log('success sending bugreport', response.status);
        } catch (e) {
            Debug.log('error sending bugreport', e);
        }
    }
}

const fontFamily = Platform.OS === 'ios' ? 'Courier' : 'monospace';

const styles = StyleSheet.create({
    mainContainer: {
        backgroundColor: ComponentColors.HEADER_COLOR,
        flex: 1,
    },
    keyboardAvoidingContainer: {
        backgroundColor: ComponentColors.BACKGROUND_COLOR,
      //  paddingBottom: DefaultTabBarHeight,
        flex: 1,
    },
    contentContainer: {
        alignItems: 'center',
        backgroundColor: ComponentColors.BACKGROUND_COLOR,
    },
    iconContainer: {
        paddingTop: 26,
        paddingBottom: 30,
    },
    text: {
        textAlign: 'center',
        paddingHorizontal: 10,
        paddingBottom: 20,
    },
    label: {
        alignSelf: 'flex-start',
        fontSize: 12,
        paddingHorizontal: 10,
        paddingTop: 9,
        paddingBottom: 7,
        color: Colors.GRAY,
    },
    logContainer: {
        width: '100%',
        marginBottom: 20,
        backgroundColor: Colors.MEDIUM_GRAY,
        paddingHorizontal: 10,
        paddingVertical: 12,
    },
    logText: {
        fontFamily: fontFamily,
        fontSize: 14,
        color: Colors.DARK_GRAY,
        backgroundColor: Colors.MEDIUM_GRAY,
    },
    restartButton: {
        paddingTop: 50,
    },
    textInput: {
        marginTop: 20,
        marginBottom: 10,
        padding: 10,
        backgroundColor: Colors.WHITE,
        fontSize: 18,
        height: 190,
        width: '100%',
        textAlignVertical: 'top',
    },
});
