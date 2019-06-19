import * as util from 'util';
import { Utils } from './Utils';
import { DateUtils } from './DateUtils';

type Logger = (s: string) => void;

export class Debug {
    public static isDebugMode = false;
    public static useColors = true;
    public static showTimestamp = false;

    public static setDebugMode(isDebug: boolean) {
        Debug.isDebugMode = isDebug;
    }

    public static setMaxLength(length: number) {
        Debug.maxLength = length;
    }

    public static log(...args: any[]) {
        if (__DEV__ && Debug.isDebugMode) {
            const timestamp = Debug.showTimestamp
                ? DateUtils.timestampToDateString(Date.now(), false)
                : ''
            ;
            if (Utils.isNodeJS() &&
                args.length === 2 &&
                typeof args[0] === 'string' &&
                typeof args[1] === 'object'
            ) {
                const name = args[0];
                const obj = args[1];
                // tslint:disable-next-line:no-console
                console.log(timestamp, name, util.inspect(obj, false, null, Debug.useColors));
            } else {
                // tslint:disable-next-line:no-console
                console.log.call(console, [timestamp, ...args]);
            }
        }
        const maxLengthArgs = args.map((value) => {
            const stringValue = (value instanceof Error)
                ? 'Error: ' + (value as Error).message
                : JSON.stringify(value);
            if (stringValue && stringValue.length > Debug.maxLength) {
                return stringValue.substring(0, Debug.maxLength);
            }
            return stringValue;
        });
        Debug.fullLog.apply(Debug, maxLengthArgs);
    }

    public static addLogger(logger: Logger) {
        Debug.loggers.push(logger);
    }

    private static maxLength = 1000;
    private static loggers: Logger[] = [];

    private static fullLog(...args: any[]) {
        if (Debug.isDebugMode) {
            const logLine = args.map(arg => '' + arg).join(' ');
            for (const logger of Debug.loggers) {
                logger(logLine);
            }
        }
    }
}
