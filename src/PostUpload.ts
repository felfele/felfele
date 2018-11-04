import { Post, Author } from './models/Post';
import { ImageData } from './models/ImageData';
import { uploadPhoto, isSwarmLink } from './Swarm';
import { Debug } from './Debug';
// tslint:disable-next-line:no-var-requires
const RNFS = require('react-native-fs');

const isImageUploaded = (image: ImageData): boolean => {
    if (image.uri != null && isSwarmLink(image.uri)) {
        return true;
    }
    return false;
};

const uploadImage = async (image: ImageData): Promise<ImageData> => {
    if (!isImageUploaded(image)) {
        if (image.localPath == null && image.localPath !== '') {
            return image;
        }
        Debug.log('uploadImage: ', image.localPath, `z${image.localPath}z`);
        const documentPath = 'file://' + RNFS.DocumentDirectoryPath + '/';
        const path = documentPath + image.localPath;
        // const statResult = await RNFS.stat(RNFS.DocumentDirectoryPath + '/' + image.localPath);
        // Debug.log('uploadImage: ', statResult);
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
    const uploadedImage = await uploadImage(author.image);
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
    const uploadedAuthor = await uploadAuthor(post.author);
    const uploadedPost = {
        ...post,
        images: uploadedImages,
        author: uploadedAuthor,
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
