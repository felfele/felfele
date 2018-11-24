import { Post, Author } from './models/Post';
import { ImageData, getLocalPath } from './models/ImageData';
import { uploadPhoto, isSwarmLink } from './Swarm';
import { Debug } from './Debug';

const isImageUploaded = (image: ImageData): boolean => {
    if (image.uri != null && isSwarmLink(image.uri)) {
        return true;
    }
    return false;
};

const uploadImage = async (image: ImageData): Promise<ImageData> => {
    if (!isImageUploaded(image)) {
        if (image.localPath == null || image.localPath === '') {
            return image;
        }
        const path = getLocalPath(image.localPath);
        const uri = await uploadPhoto(path);
        return {
            ...image,
            localPath: undefined,
            uri,
        };
    }
    return image;
};

export const uploadImages = async (images: ImageData[]): Promise<ImageData[]> => {
    const updateImages: ImageData[] = [];
    for (const image of images) {
        const updateImage = await uploadImage(image);
        updateImages.push(updateImage);
    }
    return updateImages;
};

export const uploadAuthor = async (author?: Author): Promise<Author | undefined> => {
    if (author == null) {
        return undefined;
    }
    const uploadedImage = await uploadImage(author.image!);
    return {
        ...author,
        faviconUri: '',
        image: uploadedImage,
        identity: undefined,
    };
};

export const uploadPost = async (post: Post): Promise<Post> => {
    if (post.link != null && isSwarmLink(post.link)) {
        return post;
    }
    const uploadedImages = await uploadImages(post.images);
    const uploadedPost = {
        ...post,
        images: uploadedImages,
        author: undefined,
    };

    // TODO upload post

    return uploadedPost;
};

export const uploadPosts = async (posts: Post[]): Promise<Post[]> => {
    const uploadedPosts: Post[] = [];
    for (const post of posts) {
        const uploadedPost = await uploadPost(post);
        uploadedPosts.push(uploadedPost);
    }
    return uploadedPosts;
};
