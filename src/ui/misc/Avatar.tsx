import * as React from 'react';
import { ImageStyle } from 'react-native';
import { DefaultStyle } from '../../styles';
import { defaultImages } from '../../defaultImages';
import { ImageDataView } from '../../components/ImageDataView';
import { ModelHelper } from '../../models/ModelHelper';
import { ImageData } from '../../models/ImageData';

export const Avatar = React.memo((props: { image: ImageData, modelHelper: ModelHelper, style?: ImageStyle, size: 'medium' | 'large' }) => {
    const defaultStyle = props.size === 'large' ? DefaultStyle.faviconLarge : DefaultStyle.faviconMedium;
    const defaultImage = defaultImages.defaultUser;
    return (
        <ImageDataView
            source={props.image}
            defaultImage={defaultImage}
            modelHelper={props.modelHelper}
            style={[defaultStyle, props.style]}
        />
    );
});
