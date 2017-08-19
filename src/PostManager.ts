import { Post } from './models/Post';

export interface PostManager {
    saveAndSyncPost(post: Post): Promise<void>
    deletePost(post: Post): Promise<void>
    syncPosts(): Promise<void>
    loadPosts(): Promise<void>
    getAllPosts(): Post[]
}
