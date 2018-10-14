export const generateMathRandomValues = (length: number): number[] => {
    const values: number[] = [];
    for (let i = 0; i < length; i++) {
        values.push(Math.random() * 256);
    }
    return values;
};

export const generateUnsecureRandomString = (lengthInBytes: number): string => {
    const randomBytes = generateMathRandomValues(lengthInBytes);
    return randomBytes.reduce<string>(
        (acc, value) => acc + ('0' + value.toString(16)).slice(-2),
        '',
    );
};
