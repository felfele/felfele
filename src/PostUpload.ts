import { Post, Author } from './models/Post';
import { ImageData } from './models/ImageData';
import { uploadPhoto, isSwarmLink, upload, DefaultPrefix } from './Swarm';
import { ModelHelper } from './models/ModelHelper';
import { serialize } from './social/serialization';

const isImageUploaded = (image: ImageData): boolean => {
    if (image.uri != null && isSwarmLink(image.uri)) {
        return true;
    }
    return false;
};

export const uploadImage = async (
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
        const uri = await uploadPhoto(resizedImagePath);
        return {
            ...image,
            localPath: undefined,
            uri,
        };
    }
    return image;
};

export const uploadImages = async (
    images: ImageData[],
    imageResizer: (image: ImageData, path: string) => Promise<string>,
    modelHelper: ModelHelper,
): Promise<ImageData[]> => {
    const updateImages: ImageData[] = [];
    for (const image of images) {
        const updateImage = await uploadImage(image, imageResizer, modelHelper);
        updateImages.push(updateImage);
    }
    return updateImages;
};

export const uploadAuthor = async (
    author: Author,
    imageResizer: (image: ImageData, path: string) => Promise<string>,
    modelHelper: ModelHelper,
): Promise<Author | undefined> => {
    const uploadedImage = await uploadImage(author.image!, imageResizer, modelHelper);
    return {
        ...author,
        faviconUri: '',
        image: uploadedImage,
        identity: undefined,
    };
};

export const uploadPost = async (
    post: Post,
    imageResizer: (image: ImageData, path: string) => Promise<string>,
    modelHelper: ModelHelper,
): Promise<Post> => {
    if (post.link != null && isSwarmLink(post.link)) {
        return post;
    }
    const uploadedImages = await uploadImages(post.images, imageResizer, modelHelper);
    const uploadedPost = {
        ...post,
        images: uploadedImages,
        author: undefined,
    };

    const uploadedPostJSON = serialize(uploadedPost);
    const postContentHash = await upload(uploadedPostJSON);
    const postLink = DefaultPrefix + postContentHash;

    return {
        ...uploadedPost,
        link: postLink,
    };
};

export const uploadPosts = async (
    posts: Post[],
    imageResizer: (image: ImageData, path: string) => Promise<string>,
    modelHelper: ModelHelper,
): Promise<Post[]> => {
    const uploadedPosts: Post[] = [];
    for (const post of posts) {
        const uploadedPost = await uploadPost(post, imageResizer, modelHelper);
        uploadedPosts.push(uploadedPost);
    }
    return uploadedPosts;
};
