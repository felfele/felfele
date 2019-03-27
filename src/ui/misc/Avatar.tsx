import * as React from 'react';
import { Image, ImageStyle } from 'react-native';
import { DefaultStyle } from '../../styles';
import { defaultImages } from '../../defaultImages';

export const Avatar = React.memo((props: { imageUri: string, style?: ImageStyle, size: 'medium' | 'large' }) => {
    const imageSource = props.imageUri === ''
        ? defaultImages.userCircle
        : { uri: props.imageUri };
    const defaultStyle = props.size === 'large' ? DefaultStyle.faviconLarge : DefaultStyle.faviconMedium;
    return (
        <Image source={imageSource} style={[defaultStyle, props.style]}/>
    );
});
