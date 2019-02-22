import * as React from 'react';
import { NavigationHeader } from './NavigationHeader';
import { Colors } from '../styles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { getBugReportBody } from './LogViewer';
import { Button } from './Button';
import { restartApp } from '../helpers/restart';
import { BoldText, RegularText } from '../ui/misc/text';

const BUG_REPORT_EMAIL_ADDRESS = 'bugreport@felfele.com';

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
