const defaultAreEqual = <T>(expected: T, actual: T): boolean => {
    return expected === actual;
};

export const assertEquals = <T>(expected: T, actual: T, areEqual = defaultAreEqual) => {
    if (areEqual(expected, actual) === false) {
        // tslint:disable-next-line:no-console
        console.log('expected:', expected, '\nactual:', actual);
        throw new Error(`assertEquals failed: expected: ${expected}, actual: ${actual}`);
    }
};
