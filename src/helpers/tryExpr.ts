export const tryExpr = <T>(expr: () => T | never): T | Error => {
    try {
        return expr();
    } catch (e) {
        return e;
    }
};

export const asyncTryExpr = async <T>(expr: () => Promise<T> | never): Promise<T | Error> => {
    try {
        const result = await expr();
        return result;
    } catch (e) {
        return e;
    }
};

export const isError = <T>(e: T | Error): e is Error => {
    return e instanceof Error;
};
