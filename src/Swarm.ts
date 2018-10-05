import * as SwarmJS from 'swarm-js';

const DefaultGateway = 'http://swarm.helmethair.co:80';

const swarm = SwarmJS.at(DefaultGateway);

export const upload = async (data: string): Promise<string> => {
    const hash = await swarm.upload(data);
    return hash;
};

export const download = async (hash: string): Promise<string> => {
    const array = await swarm.download(hash);
    return swarm.toString(array);
};

export const getUrlFromHash = (hash: string): string => {
    return DefaultGateway + '/bzz-raw:/' + hash;
};
