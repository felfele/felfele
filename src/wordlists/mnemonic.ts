// tslint:disable:no-bitwise
import { hexToByteArray } from '../Swarm';

interface BitStream {
    inputByteArray: number[];
    bitPosition: number;
}

const bitPositionToByte = (bitPosition: number) => bitPosition / 8;

export const getByteMasksFromPosition = (startBitPosition: number): number[] => {
    switch (startBitPosition) {
        case 0: return [0xFF, 0xE0];
        case 1: return [0x7F, 0xF0];
        case 2: return [0x3F, 0xF8];
        case 3: return [0x1F, 0xFC];
        case 4: return [0x0F, 0xFE];
        case 5: return [0x07, 0xFF];
        case 6: return [0x03, 0xFF, 0x80];
        case 7: return [0x01, 0xFF, 0xC0];
        default: throw new Error('invalid bit position: ' + startBitPosition);
    }
};

const getInputByteFromArray = (inputByteArray: number[], position: number): number => {
    if (position < inputByteArray.length) {
        return inputByteArray[position];
    }
    return 0;
};

const getNext11BitValue = (bitStream: BitStream): [number, BitStream] | null => {
    const bytePosition = Math.floor(bitStream.bitPosition / 8);
    if (bytePosition >= bitStream.inputByteArray.length) {
        return null;
    }
    const startBitPosition = bitStream.bitPosition % 8;
    const mask = getByteMasksFromPosition(startBitPosition);
    const neededBytes = mask.length - 1;
    let result = 0;
    for (let i = 0; i < mask.length; i++) {
        result = (result << 8) | (getInputByteFromArray(bitStream.inputByteArray, bytePosition + i) & mask[i]);
    }
    const shift = 8 - ((startBitPosition + 11) % 8);
    result = (result >> shift);
    return [result, {
        ...bitStream,
        bitPosition: bitStream.bitPosition + 11,
    }];
};

export const mnemonicArray = (hex: string, wordlist: string[]): string[] => {
    const valueArray = calculate11BitValueArray(hex);
    return valueArray.map(value => wordlist[value]);
};

export const calculate11BitValueArray = (hex: string): number[] => {
    const inputByteArray = hexToByteArray(hex);
    let bitStream = {
        inputByteArray,
        bitPosition: 0,
    };
    const values: number[] = [];
    while (true) {
        const nextValue = getNext11BitValue(bitStream);
        if (nextValue === null) {
            break;
        }
        values.push(nextValue[0]);
        bitStream = nextValue[1];
    }
    return values;
};
