export const DefaultGateway = 'http://swarm.helmethair.co';
export const DefaultUrlScheme = '/bzz-raw:/';

export const upload = async (data: string): Promise<string> => {
    console.log('upload to Swarm: ', data);
    try {
        const hash = await uploadData(data);
        console.log('hash is ', hash);
        return hash;
    } catch (e) {
        console.log('upload to Swarm failed: ', JSON.stringify(e));
        return '';
    }
};

export const download = async (hash: string): Promise<string> => {
    return await downloadData(hash);
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

export const uploadData = async (data: string): Promise<string> => {
    const url = DefaultGateway + '/bzz:/';
    const options: RequestInit = {
        headers: {
          'Content-Type': 'text/plain',
        },
        method: 'POST',
    };
    options.body = data;
    const response = await fetch(url, options);
    const text = await response.text();
    return text;
};

export const downloadData = async (hash: string): Promise<string> => {
    const url = DefaultGateway + '/bzz:/' + hash;
    const response = await fetch(url);
    const text = await response.text();
    return text;
};
