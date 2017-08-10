import { AsyncStorage } from 'react-native';
import { Model } from './models/Model';
import { Post } from './models/Post';
import { AuthenticationData } from './models/AuthenticationData';
import { SyncState } from './models/SyncState';

interface Metadata {
    highestSeenId: number;
}

export type QueryOrder = 'asc' | 'desc';

type UnaryConditionType = 'null' | 'notnull';
type BinaryConditionType = 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'contains' | 'in';
type ConditionType = UnaryConditionType | BinaryConditionType;

function getProperty<T, K extends keyof T>(o: T, name: K): T[K] {
    return o[name]; // o[name] is of type T[K]
}

export interface Condition<T extends Model> {
    compare(t: T): boolean;
}

class UnaryCondition<T extends Model> {
    constructor(private key: keyof T, private type: UnaryConditionType) {
    }

    compare(t) {
        switch (this.type) {
            case 'null': return getProperty(t, this.key) == null;
            case 'notnull': return getProperty(t, this.key) != null;
        }
    }
}

class BinaryCondition<T extends Model> {
    constructor(private key: keyof T, private type: BinaryConditionType, private testValue) {
    }

    compare(t) {
        switch (this.type) {
            case 'eq': return getProperty(t, this.key) == this.testValue;
            case 'neq': return getProperty(t, this.key) != this.testValue;
            case 'lt': return getProperty(t, this.key) < this.testValue;
            case 'lte': return getProperty(t, this.key) <= this.testValue;
            case 'gt': return getProperty(t, this.key) > this.testValue;
            case 'gte': return getProperty(t, this.key) >= this.testValue;
            case 'contains': return getProperty(t, this.key).indexOf(this.testValue) >= 0;
            case 'in': return this.testValue.indexOf(getProperty(t, this.key)) >= 0
        }
    }
}

export interface Queryable<T extends Model> {
    getNumItems(start: number, num: number, queryOrder: QueryOrder, conditions: Condition<T>[]);
    getHighestSeenId(): Promise<number>;
}

export class Query<T extends Model> {
    private _limit = 0;
    private queryOrder: QueryOrder = 'asc';
    private conditions: Condition<T>[] = [];

    constructor(private storage: Queryable<T>) {
    }

    async execute() {        
        const highestSeenId = await this.storage.getHighestSeenId();
        if (this._limit == 0 && this.queryOrder == 'asc') {
            this._limit = highestSeenId;
        }
        let start = 0;
        if (this.queryOrder == 'desc') {
            start = highestSeenId;
        }

        return this.storage.getNumItems(start, this._limit, this.queryOrder, this.conditions);       
    }

    limit(limit) {
        this._limit = limit;
        return this;
    }

    asc() {
        this.queryOrder = 'asc';
        return this;
    }

    desc() {
        this.queryOrder = 'desc';
        return this;
    }

    isNull(key: keyof T) {
        this.conditions.push(new UnaryCondition<T>(key, 'null'));
        return this;
    }

    isNotNull(key: keyof T) {
        this.conditions.push(new UnaryCondition<T>(key, 'notnull'));
        return this;
    }

    eq(key: keyof T, value) {
        this.conditions.push(new BinaryCondition<T>(key, 'eq', value));
        return this;
    }

    neq(key: keyof T, value) {
        this.conditions.push(new BinaryCondition<T>(key, 'eq', value));
        return this;
    }

    lt(key: keyof T, value) {
        this.conditions.push(new BinaryCondition<T>(key, 'lt', value));
        return this;
    }

    lte(key: keyof T, value) {
        this.conditions.push(new BinaryCondition<T>(key, 'lte', value));
        return this;
    }

    gt(key: keyof T, value) {
        this.conditions.push(new BinaryCondition<T>(key, 'gt', value));
        return this;
    }

    gte(key: keyof T, value) {
        this.conditions.push(new BinaryCondition<T>(key, 'gte', value));
        return this;
    }

    contains(key: keyof T, value: string) {
        this.conditions.push(new BinaryCondition<T>(key, 'contains', value));
        return this;
    }

    in(key: keyof T, value: any[]) {
        this.conditions.push(new BinaryCondition<T>(key, 'in', value));
        return this;
    }
}

export class StorageWithStringKey<T extends Model> {
    constructor(private name: string) {

    }

    clear() {
    }

    getPrefix(): string {
        return this.name + ':';
    }

    getName(): string {
        return this.name;
    }

    async getAllKeys(): Promise<string[]> {
        const keys = await AsyncStorageWrapper.getAllKeys();
        if (keys) {
            const prefix = this.getPrefix();
            return keys
                .filter((key) => key.indexOf(prefix) == 0)
                .map((key) => {return key.replace(prefix, '')})
        }
        return [];
    }
    
    async get(key: string) {
        const keyWithPrefix = this.getPrefix() + key;
        const value = await AsyncStorageWrapper.getItem(keyWithPrefix);

        if (value == null) {
            return null;
        }
        return <T>JSON.parse(value);
    }

    async set(key: string, t: T) {
        const keyWithPrefix = this.getPrefix() + key;
        const value = JSON.stringify(t);
        await AsyncStorageWrapper.setItem(keyWithPrefix, value);
    }

    async delete(key: string) {
        const keyWithPrefix = this.getPrefix() + key;
        await AsyncStorageWrapper.removeItem(keyWithPrefix);
    }
    
}

export class StorageWithAutoIds<T extends Model> implements Queryable<T> {
    private metadata: Metadata | null = null;
    private isMetadataUpdated: boolean = false;
    private storage: StorageWithStringKey<T>;
    
    constructor(name: string) {
        this.storage = new StorageWithStringKey(name);
    }

    clear() {
        this.isMetadataUpdated = false;
        this.metadata = null;
    }

    async set(t: T) {
        if (t._id == null) {
            const generatedId = await this.generateId(t);
            t._id = generatedId;
        }

        await this.storage.set('' + t._id, t);
        if (this.isMetadataUpdated) {
            const metaValue = JSON.stringify(this.metadata);
            await AsyncStorageWrapper.setItem(this.storage.getName(), metaValue);
            this.isMetadataUpdated = false;
        }
        
        return t._id;
    }

    async get(id: number) {
        return this.storage.get('' + id);
    }

    async delete(id: number) {
        this.storage.delete('' + id);
    }

    private generateKeys(min, max) {
        const keys: string[] = [];
        if (min < 0) {
            min = 0;
        }
        for (let i = min; i <= max; i++) {
            keys.push(this.storage.getPrefix() + i);
        }

        return keys;
    }

    private static generateIds(min, max, order: QueryOrder) {
        switch (order) {
            case 'asc':
                const ascIds: number[] = [];
                for (let i = min; i <= max; i++) {
                    ascIds.push(i);
                }
                return ascIds;
            case 'desc':
                const descIds: number[] = [];
                for (let i = max; i >= min; i--) {
                    descIds.push(i);
                }
                return descIds;
        }
    }

    private static getMinMaxIndices(start, num, order: QueryOrder): [number, number] {
        switch (order) {
            case 'asc':
                const max = start + num;
                return [start, max];
            case 'desc':
                const min = start - num + 1;
                return [min, start];
        }
    }

    async getNumItems(start, num, order: QueryOrder, conditions: Condition<T>[] = []): Promise<T[]> {
        const metadata = await this.tryLoadMetadata();
        if (metadata.highestSeenId == 0) {
            return [];
        }
        let startIndex = parseInt(start, 10);
        if (startIndex === NaN) {
            return [];
        }
        
        const items: T[] = [];
        while (items.length < num) {
            let [min, max] = StorageWithAutoIds.getMinMaxIndices(startIndex, num, order);
            if (min < 0) {
                min = 0;
            }
            if (max > metadata.highestSeenId) {
                max = metadata.highestSeenId;
            }

            const ids = StorageWithAutoIds.generateIds(min, max, order);
            if (ids.length == 0) {
                return items;
            }

            if (ids.length < num) {
                num = ids.length;
            }

            for (const id of ids) {
                if (items.length == num) {
                    return items;
                }
                const key = this.storage.getPrefix() + id;
                const item = await AsyncStorageWrapper.getItem(key);
                if (item) {
                    const t = JSON.parse(item);
                    const nonMatches = conditions.filter((cond) => { return !cond.compare(t)} );
                    if (nonMatches.length == 0) {
                        items.push(t);
                    }
                }

                startIndex = id;
            }

            switch (order) {
                case 'asc':
                    startIndex += 1;
                    break;
                case 'desc':
                    startIndex -= 1;
                    break;
            }
        }
        
        return items;
    }

    async getAllKeys(): Promise<number[]> {
        const stringKeys = await this.storage.getAllKeys();
        return stringKeys.map((key) => parseInt(key, 10));
    }

    async getAllValues(): Promise<T[]> {
        const metadata = await this.tryLoadMetadata();

        if (metadata.highestSeenId == 0) {
            return [];
        }

        const keys = this.generateKeys(0, metadata.highestSeenId);
        const keyValues = await AsyncStorage.multiGet(keys);

        return keyValues.map((elem) => {
            return JSON.parse(elem[1]);
        });
    }
    
    query(): Query<T> {
        return new Query<T>(this);
    }

    private async tryLoadMetadata(): Promise<Metadata> {
        if (this.metadata === null) {
            const value = await AsyncStorageWrapper.getItem(this.storage.getName());
            if (value == null) {
                this.metadata = {
                    highestSeenId: 0,
                }
                await AsyncStorageWrapper.setItem(this.storage.getName(), JSON.stringify(this.metadata));
            } else {
                console.log('tryLoadMetadata: ', value);
                this.metadata = <Metadata>JSON.parse(value);
            }
        }
        return this.metadata;
    }

    private async generateId(t: T) {
        const metadata = await this.tryLoadMetadata();
        metadata.highestSeenId += 1;
        this.isMetadataUpdated = true;
        return metadata.highestSeenId;
    }

    async getHighestSeenId() {
        const metadata = await this.tryLoadMetadata();
        return metadata.highestSeenId;
    }
}

export class AsyncStorageWrapper {
    static setItem(key, value) {
        // console.log('setItem: ', key, typeof value, value);
        try {
            return AsyncStorage.setItem(key, value);
        } catch (e) {
            console.log('setItem error: ', e);
            return null;
        }
    }

    static mergeItem(key, value) {
        // console.log('mergeItem: ', key, typeof value, value);
        try {
            return AsyncStorage.mergeItem(key, value);
        } catch (e) {
            console.log('mergeItem error: ', e);
            return null;
        }
    }

    static getItem(key) {
        // console.log('getItem: ', key);
        try {
            return AsyncStorage.getItem(key);
        } catch (e) {
            console.log('getItem error: ', e);
            return null;
        }
    }

    static removeItem(key) {
        console.log('removeItem: ', key);
        try {
            return AsyncStorage.removeItem(key);
        } catch (e) {
            console.log('removeItem error: ', e);
            return null;
        }
    }

    static getAllKeys() {
        try {
            return AsyncStorage.getAllKeys();
        } catch (e) {
            console.log('getAllKeys error: ', e);
            return null;
        }
    }

    static async getAllKeyValues() {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const keyValues = await AsyncStorage.multiGet(keys);
            return keyValues;
        } catch (e) {
            console.log('getAllValues error: ', e);
            return null;
        }
        
    }

    static clear() {
        try {
            return AsyncStorage.clear();
        } catch (e) {
            console.log('clear error: ', e);
            return null;
        }
    }
}

export const Storage = {
    'post': new StorageWithAutoIds<Post>('post'),
    'draft': new StorageWithAutoIds<Post>('draft'),
    'auth': new StorageWithStringKey<AuthenticationData>('auth'),
    'sync': new StorageWithStringKey<SyncState>('sync'),
}

