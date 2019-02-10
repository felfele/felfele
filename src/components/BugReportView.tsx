import * as React from 'react';
import { NavigationHeader } from './NavigationHeader';
import { Colors } from '../styles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { getBugReportBody } from './LogViewer';

const BUG_REPORT_EMAIL_ADDRESS = 'attila@felfele.com';

export const BugReportView = (props: { navigation: any }) => {
    return (
        <View>
            <NavigationHeader
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
                <Text style={styles.text}>
                    By sending a bug report, you agree to share with us some of your data.{'\n\n'}
                    It can be reviewed by you before sending it in your email client.{'\n\n'}
                    Tap on the Send button to continue.
                </Text>
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
});
