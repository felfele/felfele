import { Post } from './models/Post';

export interface PostManager {
    saveAndSyncPost(post: Post): Promise<void>;
    deletePost(post: Post): Promise<void>;
    loadPosts(): Promise<void>;
    getAllPosts(): Post[];
}
