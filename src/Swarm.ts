import * as SwarmJS from 'swarm-js';

const swarm = SwarmJS.at('http://swarm.helmethair.co:80');

export const upload = async (data: string): Promise<string> => {
    const hash = await swarm.upload(data);
    return hash;
};

export const download = async (hash: string): Promise<string> => {
    const array = await swarm.download(hash);
    return swarm.toString(array);
};
