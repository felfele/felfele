import { HexString } from './opaqueTypes';

// tslint:disable:no-bitwise
export const hexToString = (hex: string): string => {
    const byteArray = hexToByteArray(hex);
    return byteArrayToString(byteArray);
};

const byteArrayToStringBuiltin = (byteArray: number[]): string => {
    if (String.fromCodePoint != null) {
        return String.fromCodePoint.apply(null, byteArray);
    } else {
        return String.fromCharCode.apply(null, byteArray);
    }
};

export const byteArrayToString = (byteArray: number[]): string => {
    const maxSize = 256;
    let index = 0;
    let result = '';
    while (index < byteArray.length) {
        const slice = byteArray.slice(index, index + maxSize);
        result += byteArrayToStringBuiltin(slice);
        index += slice.length;
    }
    return result;
};

export const stringToHex = (s: string) => byteArrayToHex(stringToByteArray(s));

// cheekily borrowed from https://stackoverflow.com/questions/34309988/byte-array-to-hex-string-conversion-in-javascript
export const byteArrayToHex = (byteArray: number[] | Uint8Array, withPrefix: boolean = true): HexString => {
    const prefix = withPrefix ? '0x' : '';
    return prefix + Array.from(byteArray, (byte) => {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('') as HexString;
};

export const stringToByteArray = (str: string): number[] => {
    return toUTF8Array(str);
};

export const hexToByteArray = (hex: string): number[] => {
    const hexWithoutPrefix = hex.startsWith('0x') ? hex.slice(2) : hex;
    const subStrings: string[] = [];
    for (let i = 0; i < hexWithoutPrefix.length; i += 2) {
        subStrings.push(hexWithoutPrefix.substr(i, 2));
    }
    return subStrings.map(s => parseInt(s, 16));
};

export const isHexString = (s: string, strict: boolean = false): boolean => {
    const hasPrefix = s.startsWith('0x');
    if (strict && !hasPrefix) {
        return false;
    }
    const hex = s.substr(hasPrefix ? 2 : 0);
    if (hex.length < 2) {
        return false;
    }
    if (hex.length % 2 === 1) {
        return false;
    }
    const legalChars: string = '0123456789aAbBcCdDeEfF';
    for (let i = 0; i < hex.length; i++) {
        if (!legalChars.includes(hex.charAt(i))) {
            return false;
        }
    }
    return true;
};

const toUTF8Array = (str: string): number[] => {
    const utf8 = [];
    for (let i = 0; i < str.length; i++) {
        let charcode = str.charCodeAt(i);
        if (charcode < 0x80) {
            utf8.push(charcode);
        }
        else if (charcode < 0x800) {
            utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | (charcode >> 12),
                        0x80 | ((charcode >> 6) & 0x3f),
                        0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
            i++;
            // UTF-16 encodes 0x10000-0x10FFFF by
            // subtracting 0x10000 and splitting the
            // 20 bits of 0x0-0xFFFFF into two halves
            charcode = 0x10000 + (((charcode & 0x3ff) << 10)
                      | (str.charCodeAt(i) & 0x3ff));
            utf8.push(0xf0 | (charcode >> 18),
                      0x80 | ((charcode >> 12) & 0x3f),
                      0x80 | ((charcode >> 6) & 0x3f),
                      0x80 | (charcode & 0x3f));
        }
    }
    return utf8;
};
