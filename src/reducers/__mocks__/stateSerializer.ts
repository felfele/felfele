import { ApplicationState } from '../../models/ApplicationState';
import { Author } from '../../models/Post';

const mockAuthor: Author = {
    faviconUri: '',
    name: 'mock author',
    uri: '',
    image: {},
};

const mockAppState: ApplicationState = {
     author: mockAuthor,
     avatarStore: {},
     contentFilters: [],
     currentTimestamp: 0,
     draft: null,
     feeds: [],
     localPosts: [],
     metadata: {
         highestSeenPostId: 0,
     },
     ownFeeds: [],
     postUploadQueue: [],
     rssPosts: [],
     settings: {
         saveToCameraRoll: true,
         showDebugMenu: true,
         showSquareImages: true,
     },
};

export const getAppStateFromSerialized = async (serializedAppState: string): Promise<ApplicationState> => {
    return mockAppState;
};
export const migrateAppStateToCurrentVersion = async (appState: ApplicationState): Promise<ApplicationState> => {
    return mockAppState;
};
