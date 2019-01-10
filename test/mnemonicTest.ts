import { getByteMasksFromPosition, calculate11BitValueArray, mnemonicArray } from '../src/wordlists/mnemonic';
import { englishWordlist } from '../src/wordlists/english';

test('Test 11 bit value array with empty input', () => {
    const hexInput = '';
    const values = calculate11BitValueArray(hexInput);

    expect(values).toEqual([]);
});

test('Test 11 bit value array with zero input', () => {
    const hexInput = '0x00';
    const values = calculate11BitValueArray(hexInput);

    expect(values).toEqual([0]);
});

test('Test 11 bit value array with two values', () => {
    const hexInput = '0xFFFF';
    const values = calculate11BitValueArray(hexInput);

    expect(values).toEqual([0x7FF, 0x7C0]);
});

test('Test 11 bit value array with min and max values', () => {
    const hexInput = '0xFFE0';
    const values = calculate11BitValueArray(hexInput);

    expect(values).toEqual([0x7FF, 0]);
});

test('Test wordlist mnemonic array with min and max values', () => {
    const hexInput = '0xFFE0';
    const values = mnemonicArray(hexInput, englishWordlist);

    expect(values).toEqual(['zoo', 'abandon']);
});

test('Test wordlist mnemonic array with 192 bit input ', () => {
    const hexInput = '0x1eeb82711096bec2931c1577d499d3a7fa52fa0f1a147213';
    const values = mnemonicArray(hexInput, englishWordlist);

    expect(values).toEqual([
        'bus',
        'foster',
        'ordinary',
        'cancel',
        'hip',
        'genuine',
        'erase',
        'above',
        'jelly',
        'pill',
        'insane',
        'exit',
        'pioneer',
        'laptop',
        'detect',
        'able',
        'improve',
        'object',
    ]);
});
