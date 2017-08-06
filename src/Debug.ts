export class Debug {
    static isDebug = false;
    static withCaller = true;
    static prefix = '';
    static maxLength = 1000;
    
    static setDebug(isDebug: boolean) {
        Debug.isDebug = isDebug;
    }

    static setMaxLength(length) {
        Debug.maxLength = length;
    }

    static fullLog(...args: any[]) {
        if (Debug.isDebug) {
            if (Debug.withCaller) {
                args.unshift(Debug.getCallerNameOf(4) + ':');
            }
            if (Debug.prefix != '') {
                args.unshift(Debug.prefix);
            }
            console.log.apply(console, args);
        }
    }

    static log(...args: any[]) {
        const maxLengthArgs = args.map((value) => {
            const stringValue = JSON.stringify(value);
            if (stringValue && stringValue.length > Debug.maxLength) {
                return stringValue.substring(0, Debug.maxLength);
            }
            return stringValue;
        });
        Debug.fullLog.apply(Debug, maxLengthArgs);
    }

    static getCallerName(): string {
        return Debug.getCallerNameOf(3);
    }

    static getCallerNameOf(depth: number) {
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