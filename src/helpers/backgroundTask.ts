// import BackgroundFetch from 'react-native-background-fetch';

import { Debug } from '../Debug';

type Task = () => void;
type AsyncTask = () => Promise<void>;
type BackgroundTask = Task | AsyncTask;

export const registerBackgroundTask = (intervalMinutes: number, task: BackgroundTask) => {
    // BackgroundFetch.configure({
    //     minimumFetchInterval: intervalMinutes,
    //     stopOnTerminate: false, // android only
    //     startOnBoot: true, // android only
    // }, async () => {
    //     try {
    //         await task();
    //     } catch (e) {
    //         Debug.log('background task error', e);
    //     }
    //     BackgroundFetch.finish(BackgroundFetch.FETCH_RESULT_NEW_DATA);
    // });
};
