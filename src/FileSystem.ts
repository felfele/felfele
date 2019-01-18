import RNFetchBlob from 'rn-fetch-blob';

class FileSystemStatic {
    public getDocumentDir = () => RNFetchBlob.fs.dirs.DocumentDir;

    public exists = (path: string) => RNFetchBlob.fs.exists(path);

    public downloadFile = async (url: string, path: string): Promise<string> => {
        const resource = await RNFetchBlob
            .config({
                path,
            })
            .fetch('GET', url)
            ;

        return resource.path();
    }
}

export const FileSystem = new FileSystemStatic();
