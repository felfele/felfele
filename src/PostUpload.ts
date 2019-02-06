import { Post, Author } from './models/Post';
import { ImageData } from './models/ImageData';
import { ModelHelper } from './models/ModelHelper';
import { serialize } from './social/serialization';
import * as Swarm from './swarm/Swarm';

const isImageUploaded = (image: ImageData): boolean => {
    if (image.uri != null && Swarm.isSwarmLink(image.uri)) {
        return true;
    }
    return false;
};

export const uploadImage = async (
    swarm: Swarm.BzzApi,
    image: ImageData,
    imageResizer: (image: ImageData, path: string) => Promise<string>,
    modelHelper: ModelHelper,
): Promise<ImageData> => {
    if (!isImageUploaded(image)) {
        if (image.localPath == null || image.localPath === '') {
            return image;
        }
        const path = modelHelper.getLocalPath(image.localPath);
        const resizedImagePath = await imageResizer(image, path);
        const uri = await swarm.uploadPhoto(resizedImagePath);
        return {
            ...image,
            localPath: undefined,
            uri,
        };
    }
    return image;
};

export const uploadImages = async (
    swarm: Swarm.BzzApi,
    images: ImageData[],
    imageResizer: (image: ImageData, path: string) => Promise<string>,
    modelHelper: ModelHelper,
): Promise<ImageData[]> => {
    const updateImages: ImageData[] = [];
    for (const image of images) {
        const updateImage = await uploadImage(swarm, image, imageResizer, modelHelper);
        updateImages.push(updateImage);
    }
    return updateImages;
};

export const uploadAuthor = async (
    swarm: Swarm.BzzApi,
    author: Author,
    imageResizer: (image: ImageData, path: string) => Promise<string>,
    modelHelper: ModelHelper,
): Promise<Author | undefined> => {
    const uploadedImage = await uploadImage(swarm, author.image!, imageResizer, modelHelper);
    return {
        ...author,
        faviconUri: '',
        image: uploadedImage,
        identity: undefined,
    };
};

export const uploadPost = async (
    swarm: Swarm.BzzApi,
    post: Post,
    imageResizer: (image: ImageData, path: string) => Promise<string>,
    modelHelper: ModelHelper,
): Promise<Post> => {
    if (post.link != null && Swarm.isSwarmLink(post.link)) {
        return post;
    }
    const uploadedImages = await uploadImages(swarm, post.images, imageResizer, modelHelper);
    const uploadedPost = {
        ...post,
        images: uploadedImages,
        author: undefined,
    };

    const uploadedPostJSON = serialize(uploadedPost);
    const postContentHash = await swarm.upload(uploadedPostJSON);
    const postLink = Swarm.DefaultPrefix + postContentHash;

    return {
        ...uploadedPost,
        link: postLink,
    };
};

export const uploadPosts = async (
    swarm: Swarm.BzzApi,
    posts: Post[],
    imageResizer: (image: ImageData, path: string) => Promise<string>,
    modelHelper: ModelHelper,
): Promise<Post[]> => {
    const uploadedPosts: Post[] = [];
    for (const post of posts) {
        const uploadedPost = await uploadPost(swarm, post, imageResizer, modelHelper);
        uploadedPosts.push(uploadedPost);
    }
    return uploadedPosts;
};
