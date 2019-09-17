import { HexString } from '../helpers/opaqueTypes';
import { PrivatePost } from '../models/Post';
import { createAction } from './actionHelpers';
import { ActionTypes } from './ActionTypes';
import { ImageData } from '../models/ImageData';

export const PrivatePostActions = {
    addPrivatePost: (topic: HexString, post: PrivatePost) =>
        createAction(ActionTypes.ADD_PRIVATE_POST, { topic, post }),
    removePrivatePost: (topic: HexString, id: HexString) =>
        createAction(ActionTypes.REMOVE_PRIVATE_POST, { topic, id }),
    updatePrivatePostImages: (topic: HexString, id: HexString, images: ImageData[]) =>
        createAction(ActionTypes.UPDATE_PRIVATE_POST_IMAGES, { topic, id, images }),
};
