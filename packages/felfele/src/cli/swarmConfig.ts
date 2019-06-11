import { defaultGateway } from '@felfele/felfele-core';

interface SwarmConfig {
    gatewayAddress: string;
}

export const swarmConfig: SwarmConfig = {
    gatewayAddress: process.env.SWARM_GATEWAY || defaultGateway,
};
