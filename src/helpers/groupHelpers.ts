import { keccak256 } from 'js-sha3';
import { PublicIdentity } from '../models/Identity';
import { Post } from '../models/Post';
import { HexString } from './opaqueTypes';

export interface GroupCommandAdd {
    type: 'group-command-add';
    timestamp: number;

    identity: PublicIdentity;
    name: string;
}

export interface GroupCommandRemove {
    type: 'group-command-remove';
    timestamp: number;

    identity: PublicIdentity;
}

export interface GroupCommandPost {
    type: 'group-command-message';
    timestamp: number;

    post: Post;
}

export type GroupCommand = GroupCommandAdd | GroupCommandRemove | GroupCommandPost;

const flattenUint8Arrays = (inputs: Uint8Array[]): Uint8Array => {
    const numbers = inputs
        .map(input => Array.from(input))
        .reduce((prev, curr) => prev.concat(curr), [])
    ;
    return new Uint8Array(numbers);
};

export const keyDerivationFunction = (inputs: Uint8Array[]): Uint8Array => {
    const flatInput = flattenUint8Arrays(inputs);
    return new Uint8Array(keccak256.array(flatInput));
};
