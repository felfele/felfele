import * as React from 'react';
import { NavigationHeader } from './NavigationHeader';
import { Colors } from '../styles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { View, StyleSheet, Linking } from 'react-native';
import { Button } from './Button';
import { restartApp } from '../helpers/restart';
import { BoldText, RegularText } from '../ui/misc/text';
import { filteredLog, LogItem } from '../log';
import SvgUri from 'react-native-svg-uri';

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

const getBugReportBody = (filterFields: string[]): string => {
    return filteredLog()
        .map((logItem: LogItem) => {
            return `${logItem[0]} ${escapePII(logItem[1], filterFields)}`;
        })
        .join('\n')
        ;
};

export const BugReportView = (props: { navigation?: any, errorView: boolean }) => {
    return (
        <View style={styles.mainContainer}>
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
                    Linking.openURL(`mailto:${BUG_REPORT_EMAIL_ADDRESS}?subject=bugReport&body=Please describe the bug: \n\n\nLogs:\n${getBugReportBody(PIIKeys)}`);
                }}
            />
            <View style={styles.contentContainer}>
                <View style={styles.iconContainer}>
                    <SvgUri
                        width='29'
                        height='29'
                        fill={Colors.BRAND_PURPLE}
                        source={require('../../images/bug.svg')}
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
        </View>
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
