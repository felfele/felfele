// @ts-ignore
import { generateSecureRandom as generateSecureRandomReactNative } from 'react-native-securerandom';

export const generateSecureRandom = generateSecureRandomReactNative as (lengthInBytes: number) => Promise<Uint8Array>;
