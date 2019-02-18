import * as React from 'react';
import { Image, StyleSheet, StyleProp, ImageProperties, ImageStyle } from 'react-native';

import { ImageData } from '../models/ImageData';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';

const modelHelper = new ReactNativeModelHelper();

export interface StateProps extends ImageProperties {
    source: ImageData;
    style: StyleProp<ImageStyle>;
}

export interface DispatchProps {
}

export type Props = StateProps & DispatchProps;

export interface State {
}

export const ImageView = (props: Props) => {
    const imageUri = modelHelper.getImageUri(props.source);
    const width = props.style
        ? StyleSheet.flatten(props.style).width != null
            ? StyleSheet.flatten(props.style).width
            : props.source.width
        : props.source.width;
    const height = props.style
        ? StyleSheet.flatten(props.style).height != null
            ? StyleSheet.flatten(props.style).height
            : props.source.height
        : props.source.height;
    return (
        <Image
            source={{
                uri: imageUri,
            }}
            style={{
                width: width,
                height: height,
            }}
        />
    );
};

const styles = StyleSheet.create({
});
