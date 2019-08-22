import { AppState } from '../reducers/AppState';
import { Actions } from './Actions';

// based on https://medium.com/@martin_hotell/improved-redux-type-safety-with-typescript-2-8-2c11a8062575

export interface Action<T extends string> {
    type: T;
}

export interface ActionWithPayload<T extends string, P> extends Action<T> {
    payload: P;
}

export function createAction<T extends string>(type: T): Action<T>;
export function createAction<T extends string, P>(type: T, payload: P): ActionWithPayload<T, P>;
export function createAction<T extends string, P>(type: T, payload?: P) {
    return payload === undefined ? { type } : { type, payload };
}

export type Thunk = (dispatch: any, getState: () => AppState) => Promise<void>;
export type ThunkTypes = Thunk | Actions;

export const isActionTypes = (t: ThunkTypes): t is Actions => {
    return (t as Actions).type !== undefined;
};
