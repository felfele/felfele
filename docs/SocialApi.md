### Social App API

We are building a social application and we are using Swarm to store the data on it. Here are some ideas how the API could look like.

```
export interface ImageData {
    uri?: string;
    width?: number;
    height?: number;
    data?: string;
    localPath?: string;
}

export interface PublicIdentity {
    publicKey: string;
    address: string;
}

// TODO figure out a way to not store the privateKey at all
export interface PrivateIdentity extends PublicIdentity {
    privateKey: string;
}

export interface Author {
    name: string;
    uri: string;
    faviconUri: string;
    image?: ImageData;
    identity?: PrivateIdentity;
}

export interface PublicPost extends Model {
    images: ImageData[];
    text: string;
    createdAt: number;
}

export interface Post extends PublicPost {
    link?: string;
    location?: Location;
    deleted?: boolean;
    author?: Author;
    updatedAt?: number;
    liked?: boolean;
    isUploading?: boolean;
}
```

```
export const uploadImages = async (images: ImageData[]): Promise<ImageData[]>;
```

```
export const uploadAuthor = async (author?: Author): Promise<Author | undefined>;
```

```
export const uploadPost = async (post: Post): Promise<Post>;
```

```
export const uploadPosts = async (posts: Post[]): Promise<Post[]>;
```

```
export interface FeedApi {
    download: () => Promise<string>;
    update: (data: string) => Promise<void>;
    downloadFeed: (feedUri: string) => Promise<string>;
    getUri: () => string;
}
```

