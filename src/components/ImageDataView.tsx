import * as React from 'react';
import {
    Image,
    StyleSheet,
    StyleProp,
    ImageStyle,
    ImageProps,
    ImageBackground,
} from 'react-native';

import { ImageData, BundledImage } from '../models/ImageData';
import { ModelHelper } from '../models/ModelHelper';
import { getImageSource } from '../helpers/imageDataHelpers';
import { ChildrenProps } from '../ui/misc/ChildrenProps';

export interface StateProps extends ImageProps {
    source: ImageData;
    defaultImage?: BundledImage;
    style?: StyleProp<ImageStyle>;
    modelHelper: ModelHelper;
    background?: boolean;
    backgroundImageStyle?: StyleProp<ImageStyle>;
}

export type Props = StateProps & Partial<ChildrenProps>;

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
    if (props.background === true) {
        const { backgroundImageStyle, ...rest } = props;
        return (
            <ImageBackground
                {...rest}
                imageStyle={backgroundImageStyle}
                source={source}
                style={[props.style, {
                    width: width,
                    height: height,
                }]}
            >
                {props.children}
            </ImageBackground>
        );
    } else {
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
    }

};
