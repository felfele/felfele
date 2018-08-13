import { ActionsUnion } from './types';
import { createAction } from './actionHelpers';
import { Feed } from '../models/Feed';
import { ContentFilter } from '../models/ContentFilter';

export enum ActionTypes {
    ADD_CONTENT_FILTER = 'ADD-CONTENT-FILTER',
    REMOVE_CONTENT_FILTER = 'REMOVE-CONTENT-FILTER',
    ADD_FEED = 'ADD-FEED',
    REMOVE_FEED = 'REMOVE-FEED',
    TIME_TICK = 'TIME-TICK',
}

export const Actions = {
    addContentFilterAction: (text: string, createdAt: number, validUntil: number) =>
        createAction(ActionTypes.ADD_CONTENT_FILTER, { text, createdAt, validUntil }),
    removeContentFilterAction: (filter: ContentFilter) =>
        createAction(ActionTypes.REMOVE_CONTENT_FILTER, { filter }),
    addFeedAction: (feed: Feed) =>
        createAction(ActionTypes.ADD_FEED, { feed }),
    removeFeedAction: (feed: Feed) =>
        createAction(ActionTypes.REMOVE_FEED, { feed }),
    timeTickAction: () =>
        createAction(ActionTypes.TIME_TICK),
};

export type Actions = ActionsUnion<typeof Actions>;
