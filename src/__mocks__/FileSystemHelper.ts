import RNFetchBlob from 'rn-fetch-blob';

class FileSystemHelperStatic {
    public getDocumentDir = () => '';

    public exists = (path: string) => Promise.resolve(true);

    public fetchBlob = async (url: string, path: string): Promise<string> => Promise.resolve(path);
}

export const FileSystemHelper = new FileSystemHelperStatic();
