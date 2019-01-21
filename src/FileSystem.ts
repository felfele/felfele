import RNFetchBlob from 'rn-fetch-blob';
import { getSwarmGatewayUrl } from './Swarm';

class FileSystemStatic {
    public getDocumentDir = () => RNFetchBlob.fs.dirs.DocumentDir;

    public exists = (path: string) => RNFetchBlob.fs.exists(path);

    public downloadFile = async (url: string, path: string): Promise<string> => {
        const downloadUrl = getSwarmGatewayUrl(url);
        const resource = await RNFetchBlob
            .config({
                path,
            })
            .fetch('GET', downloadUrl)
            ;

        return resource.path();
    }
}

export const FileSystem = new FileSystemStatic();
