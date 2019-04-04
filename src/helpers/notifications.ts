// @ts-ignore
import PushNotification from 'react-native-push-notification';
import { PushNotificationIOS, Platform } from 'react-native';
import { Debug } from '../Debug';

const localNotification = () => {};

export const initializeNotifications = () => {
    PushNotification.configure({

        // (optional) Called when Token is generated (iOS and Android)
        onRegister: (token: any) => {
            Debug.log('TOKEN:', token );
        },

        // (required) Called when a remote or local notification is opened or received
        onNotification: (notification: any) => {
            Debug.log( 'NOTIFICATION:', notification );

            // process the notification

            if (Platform.OS === 'ios') {
                // required on iOS only (see fetchCompletionHandler docs: https://facebook.github.io/react-native/docs/pushnotificationios.html)
                notification.finish(PushNotificationIOS.FetchResult.NoData);
            }
        },

        // ANDROID ONLY: GCM or FCM Sender ID (product_number) (optional - not required for local notifications, but is need to receive remote push notifications)
        // senderID: "YOUR GCM (OR FCM) SENDER ID",

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
