import * as React from 'react';
import { NavigationHeader } from './NavigationHeader';
import { Colors } from '../styles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { getBugReportBody } from './LogViewer';
import { Button } from './Button';
import { restartApp } from '../helpers/restart';

const BUG_REPORT_EMAIL_ADDRESS = 'bugreport@felfele.com';

export const BugReportView = (props: { navigation?: any, errorView: boolean }) => {
    return (
        <View>
            <NavigationHeader
                leftButtonText={props.navigation ? undefined : ''}
                onPressLeftButton={() => props.navigation.goBack(null)}
                title='Bug Report'
                rightButtonText1='Send'
                onPressRightButton1={() => {
                    Linking.openURL(`mailto:${BUG_REPORT_EMAIL_ADDRESS}?subject=bugReport&body=Please describe the bug: \n\n\nLogs:\n${getBugReportBody()}`);
                }}
            />
            <View style={styles.contentContainer}>
                <View style={styles.iconContainer}>
                    <Icon
                        name='bug'
                        size={48}
                        color={Colors.GRAY}
                    />
                </View>
                {props.errorView &&
                    <Text style={styles.text}>
                        Yikes!{'\n\n'}
                        We are sorry, an error has occurred.{'\n\n'}
                        Please help us solve this issue by telling us what happened.{'\n\n'}
                        This is necessarry because we don't collect any information about our users automatically.
                    </Text>
                }
                <Text style={styles.text}>
                    By sending a bug report, you agree to share with us some of your data.{'\n\n'}
                    It can be reviewed by you before sending it in your email client.{'\n\n'}
                    Tap on the Send button to continue.
                </Text>
                {props.errorView &&
                    <Button style={styles.restartButton} text='Restart' onPress={restartApp} />
                }
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
