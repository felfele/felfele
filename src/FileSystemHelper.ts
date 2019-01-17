import RNFetchBlob from 'rn-fetch-blob';

class FileSystemHelperStatic {
    public getDocumentDir = () => RNFetchBlob.fs.dirs.DocumentDir;

    public exists = (path: string) => RNFetchBlob.fs.exists(path);

    public fetchBlob = async (url: string, path: string): Promise<string> => {
        const resource = await RNFetchBlob
            .config({
                path,
            })
            .fetch('GET', url)
            ;

        return resource.path();
    }
}

export const FileSystemHelper = new FileSystemHelperStatic();
