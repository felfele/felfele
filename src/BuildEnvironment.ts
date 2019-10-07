import { NativeModules } from 'react-native';

export const DEFAULT_BUILD_ENVIRONMENT = '';

export const getBuildEnvironment = (): string => {
    const RNConfig = NativeModules.RNConfig;
    return RNConfig != null
        ? RNConfig.buildEnvironment
        : DEFAULT_BUILD_ENVIRONMENT
    ;
};

export const getAppGroup = (): string => {
    const RNConfig = NativeModules.RNConfig;
    return RNConfig != null
        ? RNConfig.appGroup
        : ''
    ;
};
