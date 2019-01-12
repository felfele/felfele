import configureMockStore from 'redux-mock-store';
import { AppState, defaultState } from '../../src/reducers';
import { Author, Post } from '../../src/models/Post';
import { List } from 'immutable';
import { AsyncActions, ActionTypes } from '../../src/actions/Actions';

const testAuthor: Author = {
    name: 'share-tester',
    uri: '',
    faviconUri: '',
    image: {
        uri: '',
    },
};

const testState = {
    ...defaultState,
    author: testAuthor,
};

jest.mock('../../src/models/ModelHelper');

describe('share post', () => {
    let mockStore = configureMockStore<AppState>();
    let store = mockStore(testState);

    beforeEach(() => {
        mockStore = configureMockStore();
    });

    it('shared post is queued for upload', () => {
        const notEmptyQueueState: AppState = {
            ...testState,
            postUploadQueue: List<Post>({ images: [], text: 'queued test text 1', createdAt: 0 }),
        };
        store = mockStore(notEmptyQueueState);

        // @ts-ignore
        store.dispatch(AsyncActions.sharePost({ images: [], text: 'queued test text 2', createdAt: 1 }))
            .then(() => {
                expect(store.getActions()).toEqual([{
                    type: ActionTypes.QUEUE_POST_FOR_UPLOAD,
                    payload: {
                        post: {
                            images: [],
                            text: 'queued test text 2',
                            createdAt: 1,
                        },
                    },
                }]);
            });
    });
});
