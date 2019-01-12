type Logger = (s: string) => void;

export class Debug {
    public static setDebug(isDebug: boolean) {
        Debug.isDebug = isDebug;
    }

    public static setMaxLength(length) {
        Debug.maxLength = length;
    }

    public static log(...args: any[]) {
        if (__DEV__) {
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

    private static isDebug = false;
    private static maxLength = 1000;
    private static loggers: Logger[] = [];

    private static fullLog(...args: any[]) {
        if (Debug.isDebug) {
            const logLine = args.map(arg => '' + arg).join(' ');
            for (const logger of Debug.loggers) {
                logger(logLine);
            }
        }
    }
}
