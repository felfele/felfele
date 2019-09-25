import BackgroundFetch from 'react-native-background-fetch';

import { Debug } from '../Debug';
import { MINUTE } from '../DateUtils';
import { Platform } from 'react-native';

type Task = () => void;
type AsyncTask = () => Promise<void>;
type BackgroundTask = Task | AsyncTask;

export const registerBackgroundTask = (name: string, intervalMinutes: number, task: BackgroundTask) => {
    const safeTask = async () => {
        Debug.log(`Background task started: ${name}`);
        try {
            await task();
        } catch (e) {
            Debug.log('Background task error', name, e);
        }
        Debug.log(`Background task finished: ${name}`);
    };
    const backgroundFetchTask = async () => {
        await safeTask();
        BackgroundFetch.finish(BackgroundFetch.FETCH_RESULT_NEW_DATA);
    };
    const timedTask = async () => {
        await safeTask();
        setTimeout(timedTask, intervalMinutes * MINUTE);
    };

    if (Platform.OS === 'android') {
        // On Android, setting a long running timer keeps the app awake
        // but timers can only be called when the app is in the foreground
        // see https://github.com/facebook/react-native/issues/12981
        // So we just run safeTask once and then run it regularly when the
        // app is in the backround
        safeTask();
    } else {
        timedTask();
    }

    BackgroundFetch.configure({
        minimumFetchInterval: intervalMinutes,
        stopOnTerminate: false, // android only
        startOnBoot: true, // android only
    }, backgroundFetchTask);
};
