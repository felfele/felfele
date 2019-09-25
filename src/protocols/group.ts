import { keccak256 } from 'js-sha3';
import { PublicIdentity } from '../models/Identity';
import { Post } from '../models/Post';

interface GroupCommandBase {
    logicalTime: number;
    protocol: 'group';
    version: 1;
}

export interface GroupCommandAdd extends GroupCommandBase {
    type: 'group-command-add';

    identity: PublicIdentity;
    name: string;
}

export interface GroupCommandRemove extends GroupCommandBase {
    type: 'group-command-remove';

    identity: PublicIdentity;
}

export interface GroupCommandPost extends GroupCommandBase {
    type: 'group-command-post';

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
