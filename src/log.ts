import { DateUtils } from './DateUtils';

export type LogItem = [string, string];

const logData: LogItem[] = [];
let logFilter = '';

export const appendToLog = (logLine: string) => {
    const dateString = DateUtils.timestampToDateString(Date.now(), true).replace('T', ' ').replace('Z', '');
    logData.splice(0, 0, [dateString, logLine]);
};

export const clearLog = () => {
    logData.splice(0, logData.length);
};

export const filteredLog = (): LogItem[] => {
    return logData
        .filter(logItem => logItem[1].indexOf('TIME-TICK') === -1)
        .filter(logItem => logItem[1].toLowerCase().indexOf(logFilter) !== -1 || logItem[0].indexOf(logFilter) !== -1)
        ;
};

export const setLogFilter = (filter: string) => {
    logFilter = filter;
};
