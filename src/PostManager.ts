import { Config } from './Config';
import { Storage, StorageWithAutoIds, Query, Queryable, QueryOrder, Condition } from './Storage';
import { Backend } from './Backend';
import { Post, ImageData } from './models/Post';
import { SyncState, SyncStateDefaultKey } from './models/SyncState';
import * as Ghost from './GhostAPI';
import StateTracker from './StateTracker';
import { ImageDownloader } from './ImageDownloader';
import { Debug } from './Debug';

class PostCache implements Queryable<Post> {
    private posts: Map<number, Post> = new Map();

    constructor(private storage: StorageWithAutoIds<Post>) {
    }

    async getNumItems(start: number, num: number, queryOrder: QueryOrder, conditions: Condition<Post>[] = []) {
        const posts = await this.storage.getNumItems(start, num, queryOrder, conditions);
        posts.map(post => this.add(post));
        return posts;
    }
    
    async getHighestSeenId(): Promise<number> {
        return this.storage.getHighestSeenId();
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

    async set(post) {
        await this.storage.set(post);
        this.add(post);
        return post._id;
    }

    async delete(post) {
        if (post._id) {
            await this.storage.delete(post._id);
            this.remove(post);
        }
    }

    query(): Query<Post> {
        return new Query(this);
    }

    getPosts(): Post[] {
        return [...this.posts.values()];
    }

    clearCache() {
        this.posts.clear();
    }
}

export class _PostManager {
    postCache: PostCache = new PostCache(Storage.post);

    async getHighestSeenPostId() {
        const highestSeenPostId = await Storage.post.getHighestSeenId();
        return highestSeenPostId;
    }

    async syncPosts() {
        const getSyncState = async () => {
            let syncState = await Storage.sync.get(SyncStateDefaultKey);
            if (syncState == null) {
                syncState = {
                    highestSeenSyncId: 0,
                    highestSyncedPostId: 0,
                }
            }
            return syncState;
        }


        // Download and convert the posts from Ghost
        const fetchDownstreamPosts = async () => {
            const ghostPosts = await Backend.ghostAPI.getAllPosts();
            Debug.log(ghostPosts);
            const reversePosts = ghostPosts.slice(0).reverse();
            let convertedPosts: Post[] = [];
            for (const post of reversePosts) {
                const convertedPost = await this.convertGhostPostToInternal(post);
                convertedPosts.push(convertedPost);
            }
            return convertedPosts;
        }

        // Downstream is from Ghost to local
        const storeDownstreamPosts = async (downstreamPosts, syncState) => {
            const downstreamSyncState = {...syncState};
            // Store the posts from Ghost in the local database
            for (const post of downstreamPosts) {
                if (post.syncId && post.syncId > syncState.highestSeenSyncId) {
                    console.log(`Storing post ${post.syncId}: `, JSON.stringify(post));
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
                        console.log(`Uploading post ${post._id}`, {...post, images: []});
                        const syncId = await this.uploadPost(post);
                        console.log(`Uploading post __ ${post._id} ${syncId}`, {...post, images: []});
                        if (syncId) {
                            post.syncId = syncId;
                            await this.postCache.set(post);
                        }
                    }
                    // Record keeping
                    if (post.syncId && post.syncId > upstreamSyncState.highestSeenSyncId) {
                        upstreamSyncState.highestSeenSyncId = post.syncId;
                    }
                    if (post._id && post._id > upstreamSyncState.highestSyncedPostId) {
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

        const syncState = await getSyncState();
        const highestSeenPostId = await this.getHighestSeenPostId();
        const downstreamPosts = await fetchDownstreamPosts();
        const downstreamSyncState = await storeDownstreamPosts(downstreamPosts, syncState);

        const deletedSyncIds = await findDeletedSyncIds(downstreamPosts);
        await syncDeletedPosts(deletedSyncIds);

        const upstreamSyncState = await uploadLocalOnlyPosts(highestSeenPostId, syncState);
        await updateSyncState(syncState, downstreamSyncState, upstreamSyncState);
    }

    async convertGhostPostToInternal(ghostPost: Ghost.Post): Promise<Post> {
        const [text, images] = this.extractTextAndImagesFromMarkdown(ghostPost.markdown);

        // TODO Download image data too so that it's stored locally as well
        // const defaultWidth = 300;
        // const defaultHeight = 300;
        // for (const image of images) {
        //     const width = image.width ? image.width : defaultWidth;
        //     const height = image.height ? image.height : defaultHeight;
        //     image.data = await ImageDownloader.imageUriToBase64(image.uri, width, height);
        //     Debug.log(image.data.slice(0, 1000));
        // }

        const post = {
            text: text,
            images: images,
            createdAt: Date.now(),
            syncId: ghostPost.id,
        }

        return post;
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
        const highestSeenPostId = await this.getHighestSeenPostId()
        const localOnlyPosts = await this.postCache.query()
                                        .lte('_id', highestSeenPostId)
                                        .desc()
                                        .limit(highestSeenPostId)
                                        .execute();
    }

    getAllPosts() {
        const diff = (a, b) => a ? b ? b - a : 0 : 0;
        return this.postCache.getPosts().sort((a, b) => diff(a._id, b._id));
    }

    async deletePost(post: Post) {
        await Backend.ghostAPI.deletePost(post.syncId);
        await this.syncPosts();

        StateTracker.updateVersion(StateTracker.version + 1);
    }

    clearPosts() {
        this.postCache.clearCache();
    }

    async saveAndSyncPost(post: Post) {
        await this.postCache.set(post);
        await this.syncPosts();

        StateTracker.updateVersion(StateTracker.version + 1);
    }

    async uploadPost(post: Post): Promise<number | null> {
        let markdownText = this.markdownEscape(post.text);
        try {
            for (const image of post.images) {
                const path = await Backend.ghostAPI.uploadImage(image.uri);
                markdownText += `![](${path.replace(/\"/g, '')})`;
            }
            
            return await Backend.ghostAPI.uploadPost(markdownText);
        } catch (e) {
            console.error('uploadPost: ', e);
            return null;
        }
    }

    async saveDraft(post: Post): Promise<number | null> {
        const draftId = await Storage.draft.set(post);
        return draftId;
    }
}

export const PostManager = new _PostManager();