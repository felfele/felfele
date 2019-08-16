import { stringToByteArray, byteArrayToHex, hexToByteArray, stripHexPrefix } from '../../helpers/conversion';
import { keccak256 } from 'js-sha3';
import { ec } from 'elliptic';
import { PublicIdentity, PrivateIdentity } from '../../models/Identity';
import { HexString, BrandedType } from '../../helpers/opaqueTypes';
import { Debug } from '../../Debug';

export type PublicKey = BrandedType<HexString, 'PublicKey'>;
export type Address = BrandedType<HexString, 'Address'>;

export interface EncryptedData<T> {
    secret: string;
    data: T;
}

export const encrypt = <T>(secret: string, data: T): EncryptedData<T> => ({
    secret,
    data,
});

export const decrypt = <T>(encryptedData: EncryptedData<T>, secret: string): T | never => {
    if (encryptedData.secret !== secret) {
        throw new Error('decrypt: secret does not match!');
    }
    return encryptedData.data;
};

export const randomNumbers = [
    'c0b0c6949e687b3547f2048740ba86651acca488580c385de1291ed072edadf1',
    '74cfcb1fdbb910c360168c6b96dbd7465ead4c0a471d884d7df813bf81bdc4c9',
    'aa3819ed921333cc5207d29474f0a6a01c4b927abab20fe0852873b5641503af',
    'deb6660af88ed2d1f31eb2591ac291e9c4299b52ff910717266506354327b7ae',
    'b216798e60e9757fc8981d07f50b65619e27a48a7aa7ca8b5beafc7960c43932',
    '99db8a93d2cb20223a7d6dbd53974eaf9f7b96073a716fdcf0a3fa74468ce2cf',
    '65730a8c68b175de243c24bd52e77cbbf7627bd1846b8b26507e0623fa86b22b',
    '17a8357e529fde7d2a62362ed151cf83ed5ecbf46d39f82c497c55ad2139d8f2',
    '4326ddcf514b26c2ed1af1aa3c5a49c744ba3fe87a1a3e2c5ffa951ec0b7975a',
    'cd55f0448a915e2383633e707ba6305fbfc2855e795469eeaf20d1c4fb8aa761',
];

export const createRandomGenerator = (randomArray: string[]) => {
    let i = 0;
    const nextRandom = () => {
        if (i >= randomArray.length) {
            throw new Error('nextRandom: ran out of random numbers');
        }
        const random = randomArray[i];
        i += 1;
        return random;
    };
    return nextRandom;
};

const stringToUint8Array = (s: string): Uint8Array => new Uint8Array(stringToByteArray(s));

export const publicKeyToAddress = (publicKey: PublicKey): Address => {
    const curve = new ec('secp256k1');
    const ecPubKey = curve.keyFromPublic(stripHexPrefix(publicKey), 'hex');
    return ecPublicKeyToAddress(ecPubKey) as Address;
};

export const ecPublicKeyToAddress = (pubKey: ec.KeyPair) => {
    const pubBytes = pubKey.getPublic().encode();
    return byteArrayToHex(keccak256.array(pubBytes.slice(1)).slice(12));
};

export const ecGenKeyPair = (randomHex: string): ec.KeyPair => {
    const curve = new ec('secp256k1');
    const keyPairOptions = {
        entropy: stringToUint8Array(randomHex),
        entropyEnc: 'hex',
    };
    const keyPair = curve.genKeyPair(keyPairOptions);
    return keyPair;
};

export const ecPublicKeyFromPublicIdentity = (publicIdentity: PublicIdentity): ec.KeyPair => {
    const curve = new ec('secp256k1');
    return curve.keyFromPublic(stripHexPrefix(publicIdentity.publicKey as HexString), 'hex');
};

export const ecPrivateKeyFromPrivateIdentity = (privateIdentity: PrivateIdentity): ec.KeyPair => {
    const curve = new ec('secp256k1');
    return curve.keyFromPrivate(stripHexPrefix(privateIdentity.privateKey as HexString), 'hex');
};

export const ecDeriveSharedKey = (privateKeyPair: ec.KeyPair, publicKeyPair: ec.KeyPair): string => {
    return privateKeyPair.derive(publicKeyPair.getPublic()).toString(16);
};

export const createDeterministicRandomGenerator = (randomSeed: string): () => string => {
    return () => {
        const randomSeedBytes = hexToByteArray(randomSeed);
        randomSeed = byteArrayToHex(keccak256.array(randomSeedBytes), false);
        return randomSeed;
    };
};

export const throwError = (msg: string): never => {
    throw new Error(msg);
};
