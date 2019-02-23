import * as React from 'react';
import { Image, ImageStyle } from 'react-native';
import { DefaultStyle } from '../../styles';

export const Avatar = React.memo((props: { imageUri: string, style?: ImageStyle, size: 'medium' | 'large' }) => {
    const imageSource = props.imageUri === ''
        ? require('../../../images/user_circle.png')
        : { uri: props.imageUri };
    const defaultStyle = props.size === 'large' ? DefaultStyle.faviconLarge : DefaultStyle.faviconMedium;
    return (
        <Image source={imageSource} style={[defaultStyle, props.style]}/>
    );
});
