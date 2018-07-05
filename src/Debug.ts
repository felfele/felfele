export class Debug {
    public static setDebug(isDebug: boolean) {
        Debug.isDebug = isDebug;
    }

    public static setMaxLength(length) {
        Debug.maxLength = length;
    }

    public static log(...args: any[]) {
        const maxLengthArgs = args.map((value) => {
            const stringValue = JSON.stringify(value);
            if (stringValue && stringValue.length > Debug.maxLength) {
                return stringValue.substring(0, Debug.maxLength);
            }
            return stringValue;
        });
        Debug.fullLog.apply(Debug, maxLengthArgs);
    }

    private static isDebug = false;
    private static withCaller = true;
    private static prefix = '';
    private static maxLength = 1000;

    private static fullLog(...args: any[]) {
        if (Debug.isDebug) {
            if (Debug.withCaller) {
                args.unshift(Debug.getCallerNameOf(4) + ':');
            }
            if (Debug.prefix !== '') {
                args.unshift(Debug.prefix);
            }
            console.log.apply(console, args);
        }
    }

    private static getCallerNameOf(depth: number) {
        const error = new Error();
        if (error && error.stack) {
            const caller = error.stack.split('\n')[depth]
                                        .replace(/.*at ([\w\d.<>]+).*/, '$1')
                                        .replace(/(@http.*)/, '');
            return caller;
        }

        return '';
    }
}
