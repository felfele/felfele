var Url = require('url');

export class Utils {
    static async timeout<T>(ms, promise: Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            setTimeout(() => reject(new Error('timeout')), ms);
            promise.then(resolve, reject);
        });
    }   
    
    static take(list, num, defaultReturn) {
        if (list.length < num) {
            return defaultReturn;
        }
        return list.slice(0, num);
    }

    static takeLast(list, num, defaultReturn) {
        if (list.length < num) {
            return defaultReturn;
        }
        return list.slice(list.length - num);
    }

    static getHumanHostname(url: string): string {
        const hostname = Url.parse(url).hostname;
        const parts = hostname.split('.');
        const humanHostname = Utils.takeLast(parts, 2, '').join('.');
        return humanHostname;
    }
}