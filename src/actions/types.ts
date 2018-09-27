type FunctionType = (...args: any[]) => any;
interface ActionCreatorsMapObject {
    [actionCreator: string]: FunctionType;
}

export type ActionsUnion<A extends ActionCreatorsMapObject> = ReturnType<A[keyof A]>;
