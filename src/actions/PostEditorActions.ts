import { Post } from '../models/Post';
import { createAction } from './actionHelpers';
import { ActionTypes } from './ActionTypes';

export const PostEditorActions = {
    addDraft: (draft: Post) =>
        createAction(ActionTypes.ADD_DRAFT, { draft }),
    removeDraft: () =>
        createAction(ActionTypes.REMOVE_DRAFT),
};
