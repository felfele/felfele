import { isHexString } from '../../src/helpers/conversion';

test('should work with valid hex string', () => {
    const input = '0xcafe';
    const result = isHexString(input);

    expect(result).toBeTruthy();
});

test('should work with valid hex string in strict mode', () => {
    const input = '0xcafe';
    const result = isHexString(input, true);

    expect(result).toBeTruthy();
});

test('should fail with valid hex string without prefix in strict mode', () => {
    const input = 'cafe';
    const result = isHexString(input, true);

    expect(result).toBeFalsy();
});

test('should fail with invalid hex string with prefix', () => {
    const input = '0xcafeh';
    const result = isHexString(input);

    expect(result).toBeFalsy();
});

test('should fail with invalid hex string without prefix', () => {
    const input = 'cafeh';
    const result = isHexString(input);

    expect(result).toBeFalsy();
});
