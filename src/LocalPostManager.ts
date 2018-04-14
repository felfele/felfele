import { Config } from './Config';
import { Storage, StorageWithAutoIds, Query, Queryable, QueryOrder, Condition } from './Storage';
import { Post, ImageData } from './models/Post';
import { SyncState, SyncStateDefaultKey } from './models/SyncState';
import StateTracker from './StateTracker';
import { ImageDownloader } from './ImageDownloader';
import { Debug } from './Debug';
import { NetworkStatus } from './NetworkStatus';
import { DateUtils } from './DateUtils';
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

    public async syncPosts() {
        const getSyncState = async () => {
            let syncState = await Storage.sync.get(SyncStateDefaultKey);
            if (syncState == null) {
                syncState = {
                    highestSeenSyncId: 0,
                    highestSyncedPostId: 0,
                };
            }
            return syncState;
        };

        // Download and convert the posts from Ghost
        const fetchDownstreamPosts = async () => {
            return [];
        }

        // Downstream is from Ghost to local
        const storeDownstreamPosts = async (downstreamPosts, syncState) => {
            const downstreamSyncState = {...syncState};
            // Store the posts from Ghost in the local database
            for (const post of downstreamPosts) {
                if (post.syncId && post.syncId > syncState.highestSeenSyncId) {
                    Debug.log(`Storing post ${post.syncId}: `, JSON.stringify(post));
                    await this.postCache.set(post);
                    // Record keeping
                    if (post.syncId > downstreamSyncState.highestSeenSyncId) {
                        downstreamSyncState.highestSeenSyncId = post.syncId;
                    }
                    if (post._id && post._id > downstreamSyncState.highestSyncedPostId) {
                        downstreamSyncState.highestSyncedPostId = post._id;
                    }
                }
            }
            return downstreamSyncState;
        }

        const uploadLocalOnlyPosts = async (highestSeenPostId, syncState) => {
            // Upstream is from local to Ghost
            const upstreamSyncState = {...syncState};

            // Upload the local only posts
            if (highestSeenPostId > syncState.highestSyncedPostId) {
                const start = syncState.highestSyncedPostId + 1;
                const num = highestSeenPostId - syncState.highestSyncedPostId;
                const localOnlyPosts = await Storage.post.getNumItems(start, num, 'asc');

                for (const post of localOnlyPosts) {
                    if (post.syncId == null) {
                        Debug.log(`Uploading post ${post._id}`, {...post, images: 'images are retracted from logging'});
                        const syncId = await this.uploadPost(post);
                        Debug.log(`Uploading post __ ${post._id} ${syncId}`, {...post, images: 'images are retracted from logging'});
                        if (syncId) {
                            post.syncId = syncId;
                            await this.postCache.set(post);
                        }
                    }
                    // Record keeping
                    if (post.syncId && post.syncId > upstreamSyncState.highestSeenSyncId) {
                        upstreamSyncState.highestSeenSyncId = post.syncId;
                    }
                    if (post._id && post.syncId && post._id > upstreamSyncState.highestSyncedPostId) {
                        upstreamSyncState.highestSyncedPostId = post._id;
                    }
                }
            }
            return upstreamSyncState;
        }

        const findDeletedSyncIds = (downstreamPosts:Post[]) => {
            let prevSyncId = 0;
            const deletedSyncIds: number[] = [];
            for (let i = 0; i < downstreamPosts.length; i++) {
                const currentSyncId = downstreamPosts[i].syncId;
                if (currentSyncId) {
                    if (currentSyncId > prevSyncId + 1) {
                        for (let j = prevSyncId + 1; j < currentSyncId; j++) {
                            deletedSyncIds.push(j);
                        }
                    }
                    prevSyncId = currentSyncId;
                }
            }
            if (downstreamPosts.length > 0) {
                const lastSyncId = downstreamPosts[downstreamPosts.length - 1].syncId;
                if (lastSyncId && lastSyncId < syncState.highestSeenSyncId) {
                    for (let i = lastSyncId + 1; i <= syncState.highestSeenSyncId; i++) {
                        deletedSyncIds.push(i);
                    }
                }
            }
            return deletedSyncIds;
        }

        const syncDeletedPosts = async (deletedSyncIds: number[]) => {
            Debug.log('syncDeletedPosts: ', deletedSyncIds);
            const deletedPosts = await Storage.post.query()
                    .in('syncId', deletedSyncIds)
                    .execute();

            Debug.log('deletedPosts: ', deletedPosts);

            for (const post of deletedPosts) {
                if (post._id) {
                    await this.postCache.delete(post);
                }
            }
        }

        const updateSyncState = async (syncState, downstreamSyncState, upstreamSyncState) => {
            syncState.highestSyncedPostId = Math.max(
                downstreamSyncState.highestSyncedPostId, upstreamSyncState.highestSyncedPostId);
            syncState.highestSeenSyncId = Math.max(
                downstreamSyncState.highestSeenSyncId, upstreamSyncState.highestSeenSyncId);

            await Storage.sync.set(SyncStateDefaultKey, syncState);
        }

        const isConnected = await NetworkStatus.isConnected();
        if (!isConnected) {
            return;
        }
        const syncState = await getSyncState();
        const highestSeenPostId = await this.getHighestSeenPostId();
        const downstreamPosts = await fetchDownstreamPosts();
        const downstreamSyncState = await storeDownstreamPosts(downstreamPosts, syncState);

        const deletedSyncIds = await findDeletedSyncIds(downstreamPosts);
        await syncDeletedPosts(deletedSyncIds);

        const upstreamSyncState = await uploadLocalOnlyPosts(highestSeenPostId, syncState);
        await updateSyncState(syncState, downstreamSyncState, upstreamSyncState);
    }

    extractTextAndImagesFromMarkdown(markdown: string): [string, ImageData[]] {
        let images: ImageData[] = [];
        const text = markdown.replace(/(\!\[\]\(.*?\))/gi, (uri) => {
            const image: ImageData = {
                uri: Config.baseUri + uri
                        .replace('!', '')
                        .replace('[', '')
                        .replace(']', '')
                        .replace('(', '')
                        .replace(')', '')
            }
            images.push(image);
            return '';
        });
        return [text, images];
    }

    markdownEscape(text) {
        return text;
    }

    async loadPosts() {
        const highestSeenPostId = await this.getHighestSeenPostId();
        const localOnlyPosts = await this.postCache.query()
                                        .lte('_id', highestSeenPostId)
                                        .isNull('deleted')
                                        .desc()
                                        .limit(highestSeenPostId)
                                        .execute();
    }

    getAllPosts() {
        const diff = (a, b) => a ? b ? b - a : 0 : 0;
        return this.postCache.getPosts().sort((a, b) => diff(a._id, b._id));
    }

    async syncLocalDeletedPosts() {
        const highestSeenPostId = await this.getHighestSeenPostId();
        const localOnlyDeletedPosts = await Storage.post.query()
                                        .lte('_id', highestSeenPostId)
                                        .eq('deleted', true)
                                        .desc()
                                        .limit(highestSeenPostId)
                                        .execute();

        const syncIds = localOnlyDeletedPosts.map(post => post.syncId);
    }

    async deletePost(post: Post) {
        post.deleted = true;
        if (post.syncId) {
            await this.postCache.set(post);

            try {
                await this.syncLocalDeletedPosts();
            } catch(e) {
                console.error(e);
            }
        } else {
            await this.postCache.delete(post);
        }

        StateTracker.updateVersion(StateTracker.version + 1);
    }

    clearPosts() {
        this.postCache.clearCache();
    }

    async saveAndSyncPost(post: Post) {
        await this.postCache.set(post);

        this.syncPosts()
            .then(() => {
                console.log('Synced')
                StateTracker.updateVersion(StateTracker.version + 1);
            })
            .catch((reason) => console.error('Sync failed, reason: ', reason));

        StateTracker.updateVersion(StateTracker.version + 1);
    }

    async uploadPost(post: Post): Promise<number | null> {
            return 0;
    }

    async saveDraft(draft: Post): Promise<number | null> {
        // We only support one draft at the moment
        const draftId = DefaultDraftId;
        draft._id = draftId;
        return await Storage.draft.set(draft);
    }

    async loadDraft(): Promise<Post | null> {
        const draft = await Storage.draft.get(DefaultDraftId);
        if (draft != null) {
            draft._id = undefined;
        }
        return draft;
    }

    async deleteDraft(): Promise<void> {
        await Storage.draft.delete(DefaultDraftId);
    }
}

export const LocalPostManager = new _LocalPostManager();
