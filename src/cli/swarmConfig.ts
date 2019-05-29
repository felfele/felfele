import * as Swarm from '../swarm/Swarm';

interface SwarmConfig {
    gatewayAddress: string;
}

export const swarmConfig: SwarmConfig = {
    gatewayAddress: process.env.SWARM_GATEWAY || Swarm.defaultGateway,
};
