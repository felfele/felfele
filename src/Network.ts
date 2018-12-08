import { Utils } from './Utils';

export const safeFetch = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
    const response = await fetch(input, init);
    if (!response.ok) {
        throw new Error('Network error: ' + response.status);
    }
    return response;
};

export const safeFetchWithTimeout = async (input: RequestInfo, init?: RequestInit, timeout: number = 0): Promise<Response> => {
    return await Utils.timeout(timeout, safeFetch(input, init));
};
