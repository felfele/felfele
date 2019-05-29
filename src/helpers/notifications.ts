// @ts-ignore
import PushNotification from 'react-native-push-notification';
import { PushNotificationIOS, Platform, Alert } from 'react-native';
import { Debug } from '../Debug';

export const initializeNotifications = () => {
    PushNotification.configure({

        // (optional) Called when Token is generated (iOS and Android)
        onRegister: (token: any) => {
            Debug.log('TOKEN:', token);
        },

        // (required) Called when a remote or local notification is opened or received
        onNotification: (notification: any) => {
            Debug.log('NOTIFICATION:', notification);

            // process the notification
            Alert.alert(notification.message);

            if (Platform.OS === 'ios') {
                // required on iOS only (see fetchCompletionHandler docs: https://facebook.github.io/react-native/docs/pushnotificationios.html)
                notification.finish(PushNotificationIOS.FetchResult.NoData);
            } else {
                // on android this needs to be called to clear the notification
                // note that it will also clear all pending notifications!
                PushNotification.cancelAllLocalNotifications();
            }
        },

        // IOS ONLY (optional): default: all - Permissions to register.
        permissions: {
            alert: true,
            badge: true,
            sound: true,
        },

        // Should the initial notification be popped automatically
        // default: true
        popInitialNotification: true,

        /**
         * (optional) default: true
         * - Specified if permissions (ios) and token (android and ios) will requested or not,
         * - if not, you must call PushNotificationsHandler.requestPermissions() later
         */
        requestPermissions: true,
    });
};

export const localScheduledNotification = (message: string, millisecondsLater: number) => {
    PushNotification.checkPermissions((permissions: any) => {
        Debug.log('localScheduledNotification', 'permissions', permissions);
    });
    PushNotification.localNotificationSchedule({
        message,
        date: new Date(Date.now() + millisecondsLater),
        id: Date.now(),
    });
};

export const localNotification = (message: string) => {
    PushNotification.checkPermissions((permissions: any) => {
        Debug.log('localScheduledNotification', 'permissions', permissions);
    });
    PushNotification.localNotification({
        message,
        id: Date.now(),
    });
};
