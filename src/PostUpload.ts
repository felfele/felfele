import ImageResizer from 'react-native-image-resizer';

import { Post, Author } from './models/Post';
import { ImageData, getLocalPath, calculateImageDimensions } from './models/ImageData';
import { uploadPhoto, isSwarmLink } from './Swarm';
import { Debug } from './Debug';

const MAX_UPLOADED_IMAGE_DIMENSION = 400;
const MAX_UPLOADED_IMAGE_SIZE = 500 * 1024;

const isImageUploaded = (image: ImageData): boolean => {
    if (image.uri != null && isSwarmLink(image.uri)) {
        return true;
    }
    return false;
};

const isImageExceedMaximumDimensions = (image: ImageData): boolean => {
    if (image.width != null && image.width >= MAX_UPLOADED_IMAGE_DIMENSION) {
        return true;
    }
    if (image.height != null && image.height >= MAX_UPLOADED_IMAGE_DIMENSION) {
        return true;
    }
    return false;
};

const resizeImageIfNeeded = async (image: ImageData, path: string): Promise<string> => {
    if (isImageExceedMaximumDimensions(image)) {
        const [width, height] = calculateImageDimensions(image, MAX_UPLOADED_IMAGE_DIMENSION);
        const resizedImagePNG = await ImageResizer.createResizedImage(path, width, height, 'PNG', 100);
        Debug.log('resizeImageIfNeeded: ', 'resizedImagePNG', resizedImagePNG);
        if (resizedImagePNG.size != null && resizedImagePNG.size < MAX_UPLOADED_IMAGE_SIZE) {
            return resizedImagePNG.uri;
        }
        const resizedImageJPEG = await ImageResizer.createResizedImage(path, width, height, 'JPEG', 100);
        Debug.log('resizeImageIfNeeded: ', 'resizedImageJPEG', resizedImageJPEG);
        return resizedImageJPEG.uri;
    }
    return path;
};

export const uploadImage = async (image: ImageData): Promise<ImageData> => {
    if (!isImageUploaded(image)) {
        if (image.localPath == null || image.localPath === '') {
            return image;
        }
        const path = getLocalPath(image.localPath);
        const resizedImagePath = await resizeImageIfNeeded(image, path);
        const uri = await uploadPhoto(resizedImagePath);
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
