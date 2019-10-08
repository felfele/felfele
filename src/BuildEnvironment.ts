import BuildConfig from 'react-native-build-config';

export const DEFAULT_BUILD_ENVIRONMENT = '';

export const getBuildEnvironment = (): string => {
    return BuildConfig != null
        ? BuildConfig.BuildEnvironment
        : DEFAULT_BUILD_ENVIRONMENT
    ;
};

export const getAppGroup = (): string => {
    return BuildConfig != null
        ? BuildConfig.AppGroup
        : ''
    ;
};
