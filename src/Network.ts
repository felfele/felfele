export const safeFetch = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
    const response = await fetch(input, init);
    if (!response.ok) {
        throw new Error('Network error: ' + response.status);
    }
    return response;
};
