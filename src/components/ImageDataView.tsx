import * as React from 'react';
import { Image, StyleSheet, StyleProp, ImageStyle, ImageProps } from 'react-native';

import { ImageData } from '../models/ImageData';
import { ModelHelper } from '../models/ModelHelper';
import { getImageSource } from '../helpers/imageDataHelpers';

export interface StateProps extends ImageProps {
    source: ImageData;
    defaultImage?: number;
    style: StyleProp<ImageStyle>;
    modelHelper: ModelHelper;
}

export interface DispatchProps {
}

export type Props = StateProps & DispatchProps;

export interface State {
}

export const ImageDataView = (props: Props) => {
    const source = getImageSource(props.source, props.modelHelper, props.defaultImage);
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
            {...props}
            source={source}
            style={[props.style, {
                width: width,
                height: height,
            }]}
        />
    );
};

const styles = StyleSheet.create({
});
