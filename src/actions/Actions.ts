export type ActionTypes =
    | AddContentFilterAction
    ;

export interface AddContentFilterAction {
    type: 'ADD-CONTENT-FILTER';
    filter: string;
    createdAt: number;
    validUntil: number;
}

export const addContentFilterAction = (filter: string, createdAt: number, validUntil: number): AddContentFilterAction => ({
    type: 'ADD-CONTENT-FILTER',
    filter,
    createdAt,
    validUntil,
});
