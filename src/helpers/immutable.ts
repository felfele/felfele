export function removeFromArray<T>(arr: Array<T>, index: number): Array<T> {
    return [...arr.slice(0, index), ...arr.slice(index + 1)];
}

export function replaceItemInArray<T>(arr: Array<T>, element: T, index: number): Array<T> {
    return [...arr.slice(0, index), element, ...arr.slice(index + 1)];
}

export function updateArrayItem<T>(arr: Array<T>, index: number, cb: (item: T) => T): Array<T> {
    return [...arr.slice(0, index), cb(arr[index]), ...arr.slice(index + 1)];
}

export function insertInArray<T>(arr: Array<T>, element: T, index: number): Array<T> {
    return [...arr.slice(0, index), element, ...arr.slice(index)];
}

export function containsItem<T>(arr: Array<T>, condition: (item: T) => boolean): boolean {
    return arr && arr.filter(condition).length > 0;
}

export function updateObject<T>(object: T, propertiesToUpdate: Partial<T>): T {
    const retVal = Object.assign({}, object, propertiesToUpdate);
    return retVal;
}
