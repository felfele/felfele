import * as React from 'react';
import { NavigationHeader } from './NavigationHeader';
import { Colors, ComponentColors } from '../styles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { View, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { Button } from './Button';
import { restartApp } from '../helpers/restart';
import { BoldText, RegularText } from '../ui/misc/text';
import { filteredLog, LogItem } from '../log';
import { Version } from '../Version';

// @ts-ignore
import BugIcon from '../../images/bug.svg';
import { Debug } from '../Debug';
import { TypedNavigation } from '../helpers/navigation';

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

const getBugReportBody = (): string => {
    const bugReportBody = `Please describe the bug: \n\n\n${deviceInfo()}Logs:\n${piiFilteredLog()}`;
    return bugReportBody;
};

interface Props {
    navigation?: TypedNavigation;
    errorView: boolean;
}

interface State {
    isSending: boolean;
}

export class BugReportView extends React.Component<Props, State> {
    public state: State = {
        isSending: false,
    };

    public render() {
        return (
            <SafeAreaView style={styles.mainContainer}>
                <NavigationHeader
                    navigation={this.props.navigation}
                    title='Bug Report'
                    rightButton1={{
                        onPress: this.onPressSend,
                        label: <Icon
                            name={'send'}
                            size={20}
                            color={ComponentColors.NAVIGATION_BUTTON_COLOR}
                        />,
                    }}
                />
                <View style={styles.contentContainer}>
                    <View style={styles.iconContainer}>
                        <BugIcon
                            width={29}
                            height={29}
                            fill={Colors.WHITE}
                        />
                    </View>
                    {this.props.errorView &&
                        <BoldText style={[styles.text, { fontSize: 18 }]}>
                            Yikes!{'\n\n'}
                            We are sorry, an error has occurred.{'\n'}
                        </BoldText>
                    }
                    <RegularText style={[styles.text, { fontSize: 14 }]}>
                        As we never collect information automatically, it would be truly helpful if you could take a moment to let us know what happened.
                    </RegularText>

                    <RegularText style={[styles.text, { fontSize: 14, color: Colors.BRAND_PURPLE }]}>
                        By sending a bug report, you will share some of your information with us. {'\n\n'}
                        Tap on the Send button to continue.
                    </RegularText>
                    {this.props.errorView &&
                        <Button style={styles.restartButton} text='Restart' onPress={restartApp} />
                    }
                    {this.state.isSending &&
                        <ActivityIndicator style={{ paddingTop: 20 }} size='large' color='grey' />
                    }
                </View>
            </SafeAreaView>
        );
    }

    private onPressSend = async () => {
        this.setState({
            isSending: true,
        });

        await this.sendBugReport();

        this.setState({
            isSending: false,
        });

        if (this.props.navigation != null) {
            this.props.navigation.goBack();
        } else if (this.props.errorView) {
            restartApp();
        }
    }

    private sendBugReport = async () => {
        try {
            const response = await fetch('https://app.felfele.com/api/v1/bugreport/', {
                headers: {
                    'Content-Type': 'text/plain',
                },
                method: 'POST',
                body: getBugReportBody(),
            });
            Debug.log('success sending bugreport', response.status);
        } catch (e) {
            Debug.log('error sending bugreport', e);
        }
    }
}

const styles = StyleSheet.create({
    mainContainer: {
        backgroundColor: Colors.BRAND_PURPLE,
        flex: 1,
    },
    contentContainer: {
        paddingTop: 25,
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        flex: 1,
    },
    iconContainer: {
    },
    text: {
        textAlign: 'center',
        maxWidth: '80%',
        paddingTop: 50,
    },
    restartButton: {
        paddingTop: 50,
    },
});
