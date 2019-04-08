type Logger = (s: string) => void;

export class Debug {
    public static isDebugMode = false;
    public static setDebugMode(isDebug: boolean) {
        Debug.isDebugMode = isDebug;
    }

    public static setMaxLength(length: number) {
        Debug.maxLength = length;
    }

    public static log(...args: any[]) {
        if (__DEV__ && Debug.isDebugMode) {
            // tslint:disable-next-line:no-console
            console.log.call(console, ...args);
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
