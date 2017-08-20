export class Utils {
    static async timeout<T>(ms, promise: Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            setTimeout(() => reject(new Error('timeout')), ms);
            promise.then(resolve, reject);
        });
    }    
}