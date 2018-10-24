import * as SwarmJS from 'swarm-js';

export const DefaultGateway = 'http://swarm.helmethair.co:80';
export const DefaultUrlScheme = '/bzz-raw:/';

const swarm = SwarmJS.at(DefaultGateway);

export const upload = async (data: string | FormData): Promise<string> => {
    const hash = await swarm.upload(data);
    return hash;
};

export const download = async (hash: string): Promise<string> => {
    const array = await swarm.download(hash);
    return swarm.toString(array);
};

export const getUrlFromHash = (hash: string): string => {
    return DefaultGateway + DefaultUrlScheme + hash;
};

export const uploadForm = async (data: FormData): Promise<string> => {
    const url = DefaultGateway + '/bzz:/';
    const options: RequestInit = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        method: 'POST',
    };
    options.body = data;
    const response = await fetch(url, options);
    const text = await response.text();
    return text;
};

export const isSwarmUrl = (url: string): boolean => {
    return url.startsWith(DefaultGateway);
};

export const uploadPhoto = async (localPath: string): Promise<string> => {
    const data = new FormData();
    const name = 'photo.jpeg';
    data.append('photo', {
        uri: localPath,
        type: 'image/jpeg',
        name,
    } as any as Blob);
    data.append('title', 'photo');

    const hash = await uploadForm(data);
    return DefaultGateway + '/bzz:/' + hash + '/' + name;
};
