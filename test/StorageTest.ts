import 'react-native';
import { mock, release } from 'mock-async-storage';
import { AsyncStorage } from 'react-native';

import { StorageWithAutoIds, StorageWithStringKey } from '../src/Storage';
import { Post } from '../src/models/Post';
import { Model } from '../src/models/Model';

mock();

let storageWithAutoIds: StorageWithAutoIds<Post>;
let storageWithStringKey: StorageWithStringKey<Post>
let post: Post;

beforeEach(() => {
    storageWithAutoIds = new StorageWithAutoIds<Post>('test');
    storageWithStringKey = new StorageWithStringKey<Post>('test@');

    post = {
        images: [],
        text: 'text',
        createdAt: Date.now(),
    }
});

afterEach(() => {
    AsyncStorage.clear();
});

test('List empty database successfully', async () => {
    const values = await storageWithAutoIds.getAllKeys();

    expect(values.length).toBe(0);
})

test('List keys successfully', async () => {
    const key = await storageWithAutoIds.set(post);    
    const values = await storageWithAutoIds.getAllValues();

    expect(values.length).toBe(1);
    expect(values[0]).toEqual(post);
})

test('Sets and retrieves key/value successfully', async () => {
    const key = await storageWithAutoIds.set(post);
    const returnedPost = await storageWithAutoIds.get(key);
    
    expect(returnedPost).toEqual(post);
})

test('Sets value successfully with predefined id', async () => {
    const key = 'default';
    await storageWithStringKey.set(key, post);
    const returnedPost = await storageWithStringKey.get(key);
    
    expect(returnedPost).toEqual(post);
})


test('Deletes key successfully', async () => {
    const key = await storageWithAutoIds.set(post);
    await storageWithAutoIds.delete(key);

    const returnedPost = await storageWithAutoIds.get(key);
    expect(returnedPost).toEqual(null);
    
    const values = await storageWithAutoIds.getAllKeys();
    expect(values.length).toBe(0);
})

test('Store 10000 items and get the last 1000', async () => {
    const start = Date.now();

    const num = 1 * 10000;
    for (let i = 0; i < num; i++) {
        post._id = undefined;
        const key = await storageWithAutoIds.set(post);
    }
    const end = Date.now();
    // console.log('Elapsed: ', end - start);

    const numQueried = 1000;
    const values = await storageWithAutoIds.getNumItems(num, numQueried, 'desc');
    const end2 = Date.now();
    // console.log('Elapsed: ', end2 - start);
    expect(values.length).toBe(numQueried);
})

test('Get the keys of stored items', async () => {
    const numCreated = 10;
    for (let i = 0; i < numCreated; i++) {
        post._id = undefined;
        const key = await storageWithAutoIds.set(post);
    }

    const keys = await storageWithAutoIds.getAllKeys();

    expect(keys.length).toBe(numCreated);
    expect(keys).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
})

test('Try to get the last 5 items out of 10 descending', async () => {
    const numCreated = 10;
    for (let i = 0; i < numCreated; i++) {
        post._id = undefined;
        const key = await storageWithAutoIds.set(post);
    }

    await storageWithAutoIds.delete(8);

    const numQueried = 5;
    const values = await storageWithAutoIds.getNumItems(numCreated, numQueried, 'desc');

    expect(values.length).toBe(numQueried);
    expect(values.map((value) => {return value._id})).toEqual([10, 9, 7, 6, 5]);
})

test('Try to get the first 5 items out of 10 descending', async () => {
    const numCreated = 10;
    for (let i = 0; i < numCreated; i++) {
        post._id = undefined;
        const key = await storageWithAutoIds.set(post);
    }

    const numQueried = 5;
    const values = await storageWithAutoIds.getNumItems(3, numQueried, 'desc');

    expect(values.length).toBe(3);
    expect(values.map((value) => {return value._id})).toEqual([3, 2, 1]);
})

test('Try to get the first 5 items out of 10 ascending', async () => {
    const numCreated = 10;
    for (let i = 0; i < numCreated; i++) {
        post._id = undefined;
        const key = await storageWithAutoIds.set(post);
    }

    await storageWithAutoIds.delete(4);

    const numQueried = 5;
    const values = await storageWithAutoIds.getNumItems(0, numQueried, 'asc');

    expect(values.length).toBe(numQueried);
    expect(values.map((value) => {return value._id})).toEqual([1, 2, 3, 5, 6]);
})

test('Try to get  5 items out of 10 ascending', async () => {
    const numCreated = 10;
    for (let i = 0; i < numCreated; i++) {
        post._id = undefined;
        const key = await storageWithAutoIds.set(post);
    }

    const numQueried = 5;
    const values = await storageWithAutoIds.getNumItems(8, numQueried, 'asc');

    expect(values.length).toBe(3);
    expect(values.map((value) => {return value._id})).toEqual([8, 9, 10]);
})

test('Basic positive filtering', async () => {
    const numCreated = 10;
    for (let i = 0; i < numCreated; i++) {
        post._id = undefined;
        const key = await storageWithAutoIds.set(post);
    }

    const values = await storageWithAutoIds.query()
                            .eq('text', 'text')
                            .execute();

    expect(values.length).toBe(numCreated);
    expect(values.map((value) => {return value._id})).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
})

test('Basic positive filtering with limit', async () => {
    const numCreated = 10;
    for (let i = 0; i < numCreated; i++) {
        post._id = undefined;
        const key = await storageWithAutoIds.set(post);
    }

    const values = await storageWithAutoIds.query()
                            .eq('text', 'text')
                            .limit(1)
                            .execute();

    expect(values.length).toBe(1);
    expect(values.map((value) => {return value._id})).toEqual([1]);
})

test('Basic positive filtering for id', async () => {
    const numCreated = 10;
    for (let i = 0; i < numCreated; i++) {
        post._id = undefined;
        const key = await storageWithAutoIds.set(post);
    }

    const idFilter = 5;
    const values = await storageWithAutoIds.query()
                            .eq('_id', idFilter)
                            .limit(1)
                            .execute();

    expect(values.length).toBe(1);
    expect(values.map((value) => {return value._id})).toEqual([idFilter]);
})

test('Basic positive greater than filtering for id', async () => {
    const numCreated = 10;
    for (let i = 0; i < numCreated; i++) {
        post._id = undefined;
        const key = await storageWithAutoIds.set(post);
    }

    const idFilter = 5;
    const values = await storageWithAutoIds.query()
                            .gt('_id', idFilter)
                            .execute();

    expect(values.length).toBe(5);
    expect(values.map((value) => {return value._id})).toEqual([idFilter + 1, idFilter + 2, idFilter + 3, idFilter + 4, idFilter + 5]);
})

test('Basic positive filtering with ascending order', async () => {
    const numCreated = 10;
    for (let i = 0; i < numCreated; i++) {
        post._id = undefined;
        const key = await storageWithAutoIds.set(post);
    }

    const values = await storageWithAutoIds.query()
                            .eq('text', 'text')
                            .limit(1)
                            .asc()
                            .execute();

    expect(values.length).toBe(1);
    expect(values.map((value) => {return value._id})).toEqual([1]);
})

test('Basic positive filtering with descending order', async () => {
    const numCreated = 10;
    for (let i = 0; i < numCreated; i++) {
        post._id = undefined;
        const key = await storageWithAutoIds.set(post);
    }

    const values = await storageWithAutoIds.query()
                            .eq('text', 'text')
                            .limit(1)
                            .desc()
                            .execute();

    expect(values.length).toBe(1);
    expect(values.map((value) => {return value._id})).toEqual([10]);
})

test('Basic negative filtering', async () => {
    const numCreated = 10;
    for (let i = 0; i < numCreated; i++) {
        post._id = undefined;
        const key = await storageWithAutoIds.set(post);
    }

    const values = await storageWithAutoIds.query()
                            .eq('text', 'texttext')
                            .limit(1)
                            .execute();

    expect(values.length).toBe(0);
})

test('Basic contains filtering', async () => {
    const numCreated = 10;
    for (let i = 0; i < numCreated; i++) {
        post._id = undefined;
        const key = await storageWithAutoIds.set(post);
    }

    const values = await storageWithAutoIds.query()
                            .contains('text', 'tex')
                            .limit(1)
                            .execute();

    expect(values.length).toBe(1);
    expect(values.map((value) => {return value._id})).toEqual([1]);
})

test('Basic in filtering', async () => {
    const numCreated = 10;
    for (let i = 0; i < numCreated; i++) {
        post._id = undefined;
        const key = await storageWithAutoIds.set(post);
    }

    const array = [1, 2, 3];
    const values = await storageWithAutoIds.query()
                            .in('_id', array)
                            .execute();

    expect(values.length).toBe(array.length);
    expect(values.map((value) => {return value._id})).toEqual(array);
})

test('Basic in filtering with one element', async () => {
    const numCreated = 10;
    for (let i = 0; i < numCreated; i++) {
        post._id = undefined;
        post.syncId = i;
        const key = await storageWithAutoIds.set(post);
    }

    const array = [2];
    const values = await storageWithAutoIds.query()
                            .in('syncId', array)
                            .execute();

    expect(values.length).toBe(array.length);
    expect(values.map((value) => {return value.syncId})).toEqual(array);
})
