import { tryExpr, asyncTryExpr, isError } from '../../src/helpers/tryExpr';

test('successful expression with primitive type', () => {
    const returnValue = 'hello';
    const expr = () => returnValue;
    const result = tryExpr(expr);

    expect(result).toBe(returnValue);
});

test('successful expression with promise type', async () => {
    const returnValue = 'hello';
    const expr = () => Promise.resolve(returnValue);
    const result = await tryExpr(expr);

    expect(result).toBe(returnValue);
});

test('successful async expression with promise type', async () => {
    const returnValue = 'hello';
    const expr = () => Promise.resolve(returnValue);
    const result = await asyncTryExpr(expr);

    expect(result).toBe(returnValue);
});

test('expression throwing error', () => {
    const error = new Error('error');
    const expr = () => { throw error; };
    const result = tryExpr(expr);

    expect(result).toBe(error);
});

test('expression rejecting promise', async () => {
    const error = new Error('error');
    const expr = () => Promise.reject(error);
    const result = await asyncTryExpr(expr);

    expect(result).toBe(error);
});

test('successful expression with primitive type with isError', () => {
    const returnValue = 'hello';
    const expr = () => returnValue;
    const result = tryExpr(expr);

    expect(isError(result)).toBeFalsy();
});

test('expression throwing error with isError', () => {
    const error = new Error('error');
    const expr = () => { throw error; };
    const result = tryExpr(expr);

    expect(isError(result)).toBeTruthy();
});

test('expression rejecting promise', async () => {
    const error = new Error('error');
    const expr = () => Promise.reject(error);
    const result = await asyncTryExpr(expr);

    expect(isError(result)).toBeTruthy();
});
