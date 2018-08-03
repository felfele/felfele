import { Feed } from '../models/Feed';

export type ActionTypes =
    | AddContentFilterAction
    | AddFeedAction
    | RemoveFeedAction
    ;

export interface AddContentFilterAction {
    type: 'ADD-CONTENT-FILTER';
    filter: string;
    createdAt: number;
    validUntil: number;
}

export interface AddFeedAction {
    type: 'ADD-FEED';
    feed: Feed;
}

export interface RemoveFeedAction {
    type: 'REMOVE-FEED';
    feed: Feed;
}

export const action = (t: ActionTypes): ActionTypes => (t);

export const addContentFilterAction = (filter: string, createdAt: number, validUntil: number): AddContentFilterAction => ({
    type: 'ADD-CONTENT-FILTER',
    filter,
    createdAt,
    validUntil,
});

export const addFeedAction = (feed: Feed): AddFeedAction => ({
    type: 'ADD-FEED',
    feed,
});

export const removeFeedAction = (feed: Feed): RemoveFeedAction => ({
    type: 'REMOVE-FEED',
    feed,
});
