import { Post, PostReferences } from '../models/Post';
import { Author } from '../models/Author';
import { HtmlMetaData } from './htmlMetaData';
import { ImageData } from '../models/ImageData';

export const mergeUpdatedPosts = (updatedPosts: Post[], oldPosts: Post[]): Post[] => {
    const uniqueAuthors = new Map<string, Author>();
    updatedPosts.map(post => {
        if (post.author != null) {
            if (!uniqueAuthors.has(post.author.uri)) {
                uniqueAuthors.set(post.author.uri, post.author);
            }
        }
    });
    const notUpdatedPosts = oldPosts.filter(post => post.author != null && !uniqueAuthors.has(post.author.uri));
    const allPosts = notUpdatedPosts.concat(updatedPosts);
    const sortedPosts = allPosts.sort((a, b) => b.createdAt - a.createdAt);
    const startId = Date.now();
    const posts = sortedPosts.map((post, index) => ({...post, _id: post._id ? post._id : startId + index}));
    return posts;
};

export const convertHtmlMetaDataToPost = (htmlMetaData: HtmlMetaData): Post => {
    const image: ImageData = {
        uri: htmlMetaData.image,
    };
    const author: Author = {
        name: htmlMetaData.name,
        uri: htmlMetaData.feedUrl,
        image: {
            uri: htmlMetaData.icon,
        },
    };
    return {
        text: `**${htmlMetaData.title}**\n\n${htmlMetaData.description}`,
        images: [image],
        createdAt: htmlMetaData.createdAt,
        updatedAt: htmlMetaData.updatedAt,
        author,
        link: htmlMetaData.url,
    };
};

export const convertPostToParentPost = (post: Post): Post => {
    return {
        ...post,
        author: undefined,
        references: post.author != null && post.link != null
            ? {
                originalAuthor: post.author,
                original: post.link,
                parent: post.link,
            }
            : undefined,
    };
};

export const isChildrenPostUploading = (post: Post, localPosts: Post[]): boolean => {
    const isReference = (link: string, references: PostReferences) =>
        references.original === link ||
        references.parent === link
    ;
    for (const localPost of localPosts) {
        if (localPost.isUploading === true &&
            localPost.references != null &&
            typeof(post.link) === 'string' &&
            isReference(post.link, localPost.references)
        ) {
            return true;
        }
    }
    return false;
};
