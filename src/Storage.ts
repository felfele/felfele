import { AsyncStorage } from 'react-native';
import { Model } from './models/Model';
import { Post } from './models/Post';
import { Debug } from './Debug';

export type QueryOrder = 'asc' | 'desc';

type UnaryConditionType = 'null' | 'notnull';
type BinaryConditionType = 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'contains' | 'in';
type ConditionType = UnaryConditionType | BinaryConditionType;

function getProperty<T, K extends keyof T>(o: T, name: K): T[K] {
    return o[name];
}

export interface Condition<T extends Model> {
    compare(t: T): boolean;
}

class UnaryCondition<T extends Model> {
    constructor(private key: keyof T, private type: UnaryConditionType) {
    }

    public compare(t) {
        switch (this.type) {
            case 'null': return getProperty(t, this.key) == null;
            case 'notnull': return getProperty(t, this.key) != null;
        }
    }
}

class BinaryCondition<T extends Model> {
    constructor(private key: keyof T, private type: BinaryConditionType, private testValue) {
    }

    public compare(t) {
        switch (this.type) {
            case 'eq': return getProperty(t, this.key) === this.testValue;
            case 'neq': return getProperty(t, this.key) !== this.testValue;
            case 'lt': return getProperty(t, this.key) < this.testValue;
            case 'lte': return getProperty(t, this.key) <= this.testValue;
            case 'gt': return getProperty(t, this.key) > this.testValue;
            case 'gte': return getProperty(t, this.key) >= this.testValue;
            case 'contains': return getProperty(t, this.key).indexOf(this.testValue) >= 0;
            case 'in': return this.testValue.indexOf(getProperty(t, this.key)) >= 0;
        }
    }
}

export interface Queryable<T extends Model> {
    getNumItems(start: number, num: number, queryOrder: QueryOrder, conditions: Condition<T>[], highestSeenId: number);
}

export class Query<T extends Model> {
    private limitResults = 0;
    private queryOrder: QueryOrder = 'asc';
    private conditions: Condition<T>[] = [];

    constructor(private storage: Queryable<T>) {
    }

    public async execute(highestSeenId: number) {
        if (this.limitResults === 0 && this.queryOrder === 'asc') {
            this.limitResults = highestSeenId;
        }
        let start = 0;
        if (this.queryOrder === 'desc') {
            start = highestSeenId;
        }

        return this.storage.getNumItems(start, this.limitResults, this.queryOrder, this.conditions, highestSeenId);
    }

    public limit(limit) {
        this.limitResults = limit;
        return this;
    }

    public asc() {
        this.queryOrder = 'asc';
        return this;
    }

    public desc() {
        this.queryOrder = 'desc';
        return this;
    }

    public isNull(key: keyof T) {
        this.conditions.push(new UnaryCondition<T>(key, 'null'));
        return this;
    }

    public isNotNull(key: keyof T) {
        this.conditions.push(new UnaryCondition<T>(key, 'notnull'));
        return this;
    }

    public eq(key: keyof T, value) {
        this.conditions.push(new BinaryCondition<T>(key, 'eq', value));
        return this;
    }

    public neq(key: keyof T, value) {
        this.conditions.push(new BinaryCondition<T>(key, 'eq', value));
        return this;
    }

    public lt(key: keyof T, value) {
        this.conditions.push(new BinaryCondition<T>(key, 'lt', value));
        return this;
    }

    public lte(key: keyof T, value) {
        this.conditions.push(new BinaryCondition<T>(key, 'lte', value));
        return this;
    }

    public gt(key: keyof T, value) {
        this.conditions.push(new BinaryCondition<T>(key, 'gt', value));
        return this;
    }

    public gte(key: keyof T, value) {
        this.conditions.push(new BinaryCondition<T>(key, 'gte', value));
        return this;
    }

    public contains(key: keyof T, value: string) {
        this.conditions.push(new BinaryCondition<T>(key, 'contains', value));
        return this;
    }

    public in(key: keyof T, value: any[]) {
        this.conditions.push(new BinaryCondition<T>(key, 'in', value));
        return this;
    }
}

export class StorageWithStringKey<T extends Model> {
    constructor(private name: string) {

    }

    public clear() {
        // this is empty for now
    }

    public getPrefix(): string {
        return this.name + ':';
    }

    public getName(): string {
        return this.name;
    }

    public async getAllKeys(): Promise<string[]> {
        const keys = await AsyncStorageWrapper.getAllKeys();
        if (keys) {
            const prefix = this.getPrefix();
            return keys
                .filter((key) => key.indexOf(prefix) === 0)
                .map((key) => key.replace(prefix, ''));
        }
        return [];
    }

    public async get(key: string) {
        const keyWithPrefix = this.getPrefix() + key;
        const value = await AsyncStorageWrapper.getItem(keyWithPrefix);

        if (value == null) {
            return null;
        }
        return JSON.parse(value) as T;
    }

    public async set(key: string, t: T) {
        const keyWithPrefix = this.getPrefix() + key;
        const value = JSON.stringify(t);
        await AsyncStorageWrapper.setItem(keyWithPrefix, value);
    }

    public async delete(key: string) {
        const keyWithPrefix = this.getPrefix() + key;
        await AsyncStorageWrapper.removeItem(keyWithPrefix);
    }

}

export class StorageWithAutoIds<T extends Model> implements Queryable<T> {
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

    private isMetadataUpdated: boolean = false;
    private storage: StorageWithStringKey<T>;

    constructor(name: string) {
        this.storage = new StorageWithStringKey(name);
    }

    public clear() {
        this.isMetadataUpdated = false;
    }

    public async get(id: number) {
        return this.storage.get('' + id);
    }

    public async delete(id: number) {
        this.storage.delete('' + id);
    }

    public async getNumItems(start, num, order: QueryOrder, conditions: Condition<T>[] = [], highestSeenId): Promise<T[]> {
        if (highestSeenId === 0) {
            return [];
        }
        let startIndex = parseInt(start, 10);
        if (isNaN(startIndex)) {
            return [];
        }

        const items: T[] = [];
        while (items.length < num) {
            let [min, max] = StorageWithAutoIds.getMinMaxIndices(startIndex, num, order);
            if (min < 0) {
                min = 0;
            }
            if (max > highestSeenId) {
                max = highestSeenId;
            }

            const ids = StorageWithAutoIds.generateIds(min, max, order);
            if (ids.length === 0) {
                return items;
            }

            if (ids.length < num) {
                num = ids.length;
            }

            for (const id of ids) {
                if (items.length === num) {
                    return items;
                }
                const key = this.storage.getPrefix() + id;
                const item = await AsyncStorageWrapper.getItem(key);
                if (item) {
                    const t = JSON.parse(item);
                    const nonMatches = conditions.filter((cond) => !cond.compare(t) );
                    if (nonMatches.length === 0) {
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

    public async getAllKeys(): Promise<number[]> {
        const stringKeys = await this.storage.getAllKeys();
        return stringKeys.map((key) => parseInt(key, 10));
    }

    public query(): Query<T> {
        return new Query<T>(this);
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
}

export class AsyncStorageWrapper {
    public static setItem(key, value) {
        try {
            return AsyncStorage.setItem(key, value);
        } catch (e) {
            console.log('setItem error: ', e);
            return null;
        }
    }

    public static mergeItem(key, value) {
        try {
            return AsyncStorage.mergeItem(key, value);
        } catch (e) {
            console.log('mergeItem error: ', e);
            return null;
        }
    }

    public static getItem(key) {
        try {
            const value = AsyncStorage.getItem(key);
            return value;
        } catch (e) {
            console.log('getItem error: ', e);
            return null;
        }
    }

    public static removeItem(key) {
        try {
            return AsyncStorage.removeItem(key);
        } catch (e) {
            console.log('removeItem error: ', e);
            return null;
        }
    }

    public static getAllKeys() {
        try {
            return AsyncStorage.getAllKeys();
        } catch (e) {
            console.log('getAllKeys error: ', e);
            return null;
        }
    }

    public static async getAllKeyValues() {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const keyValues = await AsyncStorage.multiGet(keys);
            return keyValues;
        } catch (e) {
            console.log('getAllValues error: ', e);
            return null;
        }

    }

    public static clear() {
        try {
            return AsyncStorage.clear();
        } catch (e) {
            console.log('clear error: ', e);
            return null;
        }
    }
}

export const Storage = {
    post: new StorageWithAutoIds<Post>('post'),
};
