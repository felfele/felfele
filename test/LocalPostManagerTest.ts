import 'react-native';
import { mock, release } from 'mock-async-storage';

import { Storage } from '../src/Storage';
import { Backend } from '../src/Backend';
import { LocalPostManager } from '../src/LocalPostManager';
import { Post as GhostPost } from '../src/GhostAPI';
import { SyncState } from '../src/models/SyncState';
import { Post } from '../src/models/Post';
import { Debug } from '../src/Debug';

mock();

jest.mock('react-native-fetch-blob', () => {
  return {
    DocumentDir: () => {},
    ImageCache: {
      get: {
        clear: () => {}
      }
    }
  }
})

beforeEach(() => {
});

afterEach(() => {
});

const DefaultGhostPost:GhostPost = {
    markdown: '',
    id: 1,
    created_at: '',
    created_by: 0,
    updated_at: '',
    updated_by: 0,
    published_at: '',
    title: '',
    slug: '',
    image: null,
    featured: false,
    page: false,
    status: 'published',
    language: 'en_US',
    meta_title: null,
    meta_description: null,
    author: '',
    publishedBy: null,
    tags: [],
}

const DefaultPost:Post = {
    _id: 1,
    images: [],
    text: '',
    createdAt: Date.now(),
}

function Backend_ghostAPI_getAllPosts(numPosts) {
    const posts:GhostPost[] = [];
    for (let i = 1; i <= numPosts; i++) {
        const post = {...DefaultGhostPost};
        post.id = i;
        post.created_at = '' + Date.now();
        posts.push(post);
    }
    return posts;
}

test('Sync one post', async (done) => {
    Backend.ghostAPI.getAllPosts = async () => { return [DefaultGhostPost]; }
    Storage.post.set = async (post) => {return 1;}
    Storage.sync.get = async () => {return null;}
    Storage.sync.set = async (key, syncState) => {
        expect(syncState.highestSeenSyncId).toBe(DefaultGhostPost.id);
        expect(syncState.highestSyncedPostId).toBe(0);
        done();
        return;
    }

    LocalPostManager.syncPosts();
})

test('Sync first post with the server already having posts', async (done) => {
    const numGhostPosts = 3;
    const syncState = {
        highestSeenSyncId: 0,
        highestSyncedPostId: 0,
    }
    Backend.ghostAPI.getAllPosts = async () => { return Backend_ghostAPI_getAllPosts(numGhostPosts); }
    LocalPostManager.uploadPost = async () => { return numGhostPosts + 1; }
    Storage.post.getHighestSeenId = async () => {return <number>DefaultPost._id;}
    Storage.post.set = async (post) => {return <number>post._id;}
    Storage.post.getNumItems = async (...a) => {  return [DefaultPost]; }
    Storage.sync.get = async () => {return syncState;}
    Storage.sync.set = async (key, syncState) => {
        expect(syncState.highestSeenSyncId).toBe(numGhostPosts + 1);
        expect(syncState.highestSyncedPostId).toEqual(1);
        done();
        return;
    }

    LocalPostManager.syncPosts();
})

test('Sync with deleted post on the server', async (done) => {
    const ghostPosts = [{...DefaultGhostPost, id: 2}];
    const localPosts = [{...DefaultPost, _id: 1, syncId: 1}, {...DefaultPost, _id: 2, syncId: 2}]
    const syncState = {
        highestSeenSyncId: 2,
        highestSyncedPostId: 2,
    }
    Backend.ghostAPI.getAllPosts = async () => { return ghostPosts; }
    LocalPostManager.uploadPost = async () => { return ghostPosts.length; }

    Storage.post.getHighestSeenId = async () => {return syncState.highestSyncedPostId;}
    Storage.post.set = async (post) => {return <number>post._id;}
    Storage.post.getNumItems = async (...a) => {  return localPosts; }
    Storage.sync.get = async () => {return syncState;}
    Storage.sync.set = async (key, syncState) => { return; }
    Storage.post.delete = async (key) => {
        expect(key).toBe(1);
        done();
        return;
    }

    LocalPostManager.syncPosts();
})

test('Sync with deleted last post on the server', async (done) => {
    const ghostPosts = [{...DefaultGhostPost, id: 1}];
    const localPosts = [{...DefaultPost, _id: 1, syncId: 1}, {...DefaultPost, _id: 2, syncId: 2}]
    const syncState = {
        highestSeenSyncId: 2,
        highestSyncedPostId: 2,
    }
    Backend.ghostAPI.getAllPosts = async () => { return ghostPosts; }
    LocalPostManager.uploadPost = async () => { return ghostPosts.length; }
    Storage.post.getHighestSeenId = async () => {return syncState.highestSyncedPostId;}
    Storage.post.set = async (post) => {return <number>post._id;}
    Storage.post.getNumItems = async (...a) => {  return [localPosts[1]]; }
    Storage.sync.get = async () => {return syncState;}
    Storage.sync.set = async (key, syncState) => { return; }
    Storage.post.delete = async (key) => {
        expect(key).toBe(2);
        done();
        return;
    }

    LocalPostManager.syncPosts();
})
