import RNFetchBlob from 'rn-fetch-blob';

class FileSystemStatic {
    public getDocumentDir = () => '';

    public exists = (path: string) => Promise.resolve(true);

    public downloadFile = async (url: string, path: string): Promise<string> => Promise.resolve(path);
}

export const FileSystem = new FileSystemStatic();
