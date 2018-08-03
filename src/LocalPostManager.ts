import { Config } from './Config';
import { Storage, StorageWithAutoIds, Query, Queryable, QueryOrder, Condition } from './Storage';
import { Post, ImageData } from './models/Post';
import StateTracker from './StateTracker';
import { PostManager } from './PostManager';

const DefaultDraftId = 1;

class PostCache implements Queryable<Post> {
    private posts: Map<number, Post> = new Map();

    constructor(private storage: StorageWithAutoIds<Post>) {
    }

    public async getNumItems(start: number, num: number, queryOrder: QueryOrder, conditions: Condition<Post>[] = []) {
        const posts = await this.storage.getNumItems(start, num, queryOrder, conditions);
        posts.map(post => this.add(post));
        return posts;
    }

    public async getHighestSeenId(): Promise<number> {
        return this.storage.getHighestSeenId();
    }

    public async set(post) {
        console.log('PostCache.set ', post);
        await this.storage.set(post);
        if (post.deleted) {
            this.remove(post);
        } else {
            this.add(post);
        }
        return post._id;
    }

    public async delete(post) {
        if (post._id) {
            await this.storage.delete(post._id);
            this.remove(post);
        }
    }

    public query(): Query<Post> {
        return new Query(this);
    }

    public getPosts(): Post[] {
        return [...this.posts.values()];
    }

    public clearCache() {
        this.posts.clear();
    }

    private add(post) {
        if (post._id) {
            this.posts.set(post._id, post);
        }
    }

    private remove(post) {
        if (post._id) {
            this.posts.delete(post._id);
        }
    }
}

export class _LocalPostManager implements PostManager {
    private postCache: PostCache = new PostCache(Storage.post);

    public async getHighestSeenPostId() {
        const highestSeenPostId = await Storage.post.getHighestSeenId();
        return highestSeenPostId;
    }

    public async loadPosts() {
        const highestSeenPostId = await this.getHighestSeenPostId();
        const localOnlyPosts = await this.postCache.query()
                                        .lte('_id', highestSeenPostId)
                                        .isNull('deleted')
                                        .desc()
                                        .limit(highestSeenPostId)
                                        .execute();
    }

    public getAllPosts() {
        const diff = (a, b) => a ? b ? b - a : 0 : 0;
        return this.postCache.getPosts().sort((a, b) => diff(a._id, b._id));
    }

    public async syncLocalDeletedPosts() {
        const highestSeenPostId = await this.getHighestSeenPostId();
        const localOnlyDeletedPosts = await Storage.post.query()
                                        .lte('_id', highestSeenPostId)
                                        .eq('deleted', true)
                                        .desc()
                                        .limit(highestSeenPostId)
                                        .execute();

        const syncIds = localOnlyDeletedPosts.map(post => post.syncId);
    }

    public async deletePost(post: Post) {
        post.deleted = true;
        if (post.syncId) {
            await this.postCache.set(post);

            try {
                await this.syncLocalDeletedPosts();
            } catch (e) {
                console.error(e);
            }
        } else {
            await this.postCache.delete(post);
        }

        StateTracker.updateVersion(StateTracker.version + 1);
    }

    public clearPosts() {
        this.postCache.clearCache();
    }

    public async saveAndSyncPost(post: Post) {
        console.log('LocalPostManager.saveAndSyncPost: ', post);
        await this.postCache.set(post);
        StateTracker.updateVersion(StateTracker.version + 1);
    }

    public async syncPosts() {
        // Empty
    }

    public async uploadPost(post: Post): Promise<number | null> {
            return 0;
    }

    public async saveDraft(draft: Post): Promise<number | null> {
        // We only support one draft at the moment
        const draftId = DefaultDraftId;
        draft._id = draftId;
        return await Storage.draft.set(draft);
    }

    public async loadDraft(): Promise<Post | null> {
        const draft = await Storage.draft.get(DefaultDraftId);
        if (draft != null) {
            draft._id = undefined;
        }
        return draft;
    }

    public async deleteDraft(): Promise<void> {
        await Storage.draft.delete(DefaultDraftId);
    }

    public extractTextAndImagesFromMarkdown(markdown: string): [string, ImageData[]] {
        const images: ImageData[] = [];
        const text = markdown.replace(/(\!\[\]\(.*?\))/gi, (uri) => {
            const image: ImageData = {
                uri: Config.baseUri + uri
                        .replace('!', '')
                        .replace('[', '')
                        .replace(']', '')
                        .replace('(', '')
                        .replace(')', ''),
            };
            images.push(image);
            return '';
        });
        return [text, images];
    }
}

export const LocalPostManager = new _LocalPostManager();
