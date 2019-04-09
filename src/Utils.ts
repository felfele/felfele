const clearTimeoutIfSet = (timeout: any) => {
    if (timeout != null) {
        clearTimeout(timeout);
    }
};

export class Utils {
    public static async timeout<T>(ms: number, promise: Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const timeout = ms > 0
                ? setTimeout(() => reject(new Error('timeout')), ms)
                : undefined
            ;
            promise.then((value) => {
                clearTimeoutIfSet(timeout);
                resolve(value);
            }, (reason) => {
                clearTimeoutIfSet(timeout);
                reject(reason);
            });
        });
    }

    public static async waitMillisec(ms: number): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            if (ms > 0) {
                setTimeout(() => resolve(ms), ms);
            }
        });
    }

    public static async waitUntil(untilTimestamp: number, now: number = Date.now()): Promise<number> {
        const diff = untilTimestamp - now;
        if (diff > 0) {
            return Utils.waitMillisec(diff);
        }
        return 0;
    }

    public static take<T>(list: Array<T>, num: number, defaultReturn: T) {
        if (list.length < num) {
            return [defaultReturn];
        }
        return list.slice(0, num);
    }

    public static takeLast<T>(list: Array<T>, num: number, defaultReturn: T) {
        if (list.length < num) {
            return [defaultReturn];
        }
        return list.slice(list.length - num);
    }
}
