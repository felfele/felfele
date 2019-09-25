import { PostListDict } from './version4';
import { Actions } from '../actions/Actions';
import { ActionTypes } from '../actions/ActionTypes';
import { removeFromArray, updateArrayItem } from '../helpers/immutable';

export const privatePostsReducer = (privatePosts: PostListDict = {}, action: Actions): PostListDict => {
    switch (action.type) {
        case ActionTypes.ADD_PRIVATE_POST: {
            const postList = action.payload.topic in privatePosts
                ? [action.payload.post, ...privatePosts[action.payload.topic]]
                : [action.payload.post]
            ;
            return {
                ...privatePosts,
                [action.payload.topic]: postList,
            };
        }
        case ActionTypes.REMOVE_PRIVATE_POST: {
            if (action.payload.topic in privatePosts === false) {
                return privatePosts;
            }
            const topicPosts = privatePosts[action.payload.topic];
            const ind = topicPosts.findIndex(post => post._id === action.payload.id);
            if (ind === -1) {
                return privatePosts;
            }
            const updatedTopicPosts = removeFromArray(topicPosts, ind);
            return {
                ...privatePosts,
                [action.payload.topic]: updatedTopicPosts,
            };
        }
        case ActionTypes.UPDATE_PRIVATE_POST_IMAGES: {
            if (action.payload.topic in privatePosts === false) {
                return privatePosts;
            }
            const topicPosts = privatePosts[action.payload.topic];
            const ind = topicPosts.findIndex(post => post._id === action.payload.id);
            if (ind === -1) {
                return privatePosts;
            }
            const updatedTopicPosts = updateArrayItem(topicPosts, ind, post => ({
                ...post,
                images: action.payload.images,
            }));
            return {
                ...privatePosts,
                [action.payload.topic]: updatedTopicPosts,
            };
        }
        case ActionTypes.REMOVE_PRIVATE_POSTS_WITH_TOPIC: {
            const privatePostsCopy = {
                ...privatePosts,
            };
            delete privatePostsCopy[action.payload.topic];
            return privatePostsCopy;
        }
        default: {
            return privatePosts;
        }
    }
};
