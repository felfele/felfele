import { Storage, StorageWithAutoIds, Query, Queryable, QueryOrder, Condition } from './Storage';
import { Post } from './models/Post';

class PostCache implements Queryable<Post> {
    private posts: Map<number, Post> = new Map();

    constructor(private storage: StorageWithAutoIds<Post>) {
    }

    public async getNumItems(start: number, num: number, queryOrder: QueryOrder, conditions: Condition<Post>[] = [], highestSeenId: number) {
        const posts = await this.storage.getNumItems(start, num, queryOrder, conditions, highestSeenId);
        posts.map(post => this.add(post));
        return posts;
    }

    public query(): Query<Post> {
        return new Query(this);
    }

    private add(post) {
        if (post._id) {
            this.posts.set(post._id, post);
        }
    }
}
