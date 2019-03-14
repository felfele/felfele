import * as React from 'react';
import { NavigationHeader } from './NavigationHeader';
import { Colors } from '../styles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { View, StyleSheet, Linking, SafeAreaView } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { Button } from './Button';
import { restartApp } from '../helpers/restart';
import { BoldText, RegularText } from '../ui/misc/text';
import { filteredLog, LogItem } from '../log';
import { Version } from '../Version';

// @ts-ignore
import BugIcon from '../../images/bug.svg';

const BUG_REPORT_EMAIL_ADDRESS = 'bugreport@felfele.com';
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

export const BugReportView = (props: { navigation?: any, errorView: boolean }) => {
    return (
        <SafeAreaView style={styles.mainContainer}>
            <NavigationHeader
                leftButtonText={props.navigation ? undefined : ''}
                onPressLeftButton={() => props.navigation.goBack(null)}
                title='Bug Report'
                rightButtonText1={
                    <Icon
                        name={'send'}
                        size={20}
                        color={Colors.BRAND_PURPLE}
                    />
                }
                onPressRightButton1={() => {
                    Linking.openURL(`mailto:${BUG_REPORT_EMAIL_ADDRESS}?subject=bugReport&body=${getBugReportBody()}`);
                }}
            />
            <View style={styles.contentContainer}>
                <View style={styles.iconContainer}>
                    <BugIcon
                        width={29}
                        height={29}
                        fill={Colors.BRAND_PURPLE}
                    />
                </View>
                {props.errorView &&
                    <BoldText style={[styles.text, { fontSize: 18 }]}>
                        Yikes!{'\n\n'}
                        We are sorry, an error has occurred.{'\n'}
                    </BoldText>
                }
                <RegularText style={[styles.text, { fontSize: 14 }]}>
                    As we never collect information automatically, it would be truly helpful if you could take a moment to let us know what happened.
                </RegularText>
                <RegularText style={[styles.text, { fontSize: 14, color: Colors.BRAND_PURPLE }]}>
                    By sending a bug report, you will share some of your information with us. You can review everything in your email client before sending.{'\n\n'}
                    Tap on the Send button to continue.
                </RegularText>
                {props.errorView &&
                    <Button style={styles.restartButton} text='Restart' onPress={restartApp} />
                }
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        backgroundColor: Colors.WHITE,
        flex: 1,
    },
    contentContainer: {
        paddingTop: 25,
        flexDirection: 'column',
        alignItems: 'center',
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
