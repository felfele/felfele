import * as React from 'react';
import { View, StyleSheet, LayoutChangeEvent, Dimensions } from 'react-native';

import { ImageData } from '../models/ImageData';
import { TouchableView } from './TouchableView';
import { ImageDataView } from './ImageDataView';
import { ModelHelper } from '../models/ModelHelper';
import { Colors } from '../styles';

export interface StateProps {
    columns: number;
    images: ImageData[];
    height: number;
    modelHelper: ModelHelper;
}

export interface DispatchProps {
    onRemoveImage?: (image: ImageData) => void;
}

type Props = StateProps & DispatchProps;

export class ImagePreviewGrid extends React.Component<Props, any> {
    public render() {
        const windowWidth = Dimensions.get('window').width;
        if (this.props.images.length === 0) {
            return null;
        }
        const spacing = 10;
        const maxWidth = Math.floor((windowWidth - spacing * 4) / this.props.columns);
        const maxHeight = maxWidth;

        const images = this.props.images.map((image) =>
            <TouchableView
                onLongPress={() => this.props.onRemoveImage && this.props.onRemoveImage(image)}
                key={image.localPath}
                style={{ padding: 5 }}
            >
                <ImageDataView
                    source={image}
                    style={{
                        width: this.notGreaterThan(image.width, maxWidth),
                        height: maxHeight != null ? this.notGreaterThan(image.height, maxHeight) : maxWidth,
                    }}
                    modelHelper={this.props.modelHelper}
                />
            </TouchableView>
        );

        return (
            <View style={[styles.gridContainer, {height: maxHeight}]}>
                <View style={{ flexDirection: 'row' }}>
                    {images}
                </View>
            </View>
        );
    }

    private notGreaterThan(value: number | undefined, maxValue: number) {
        return value != null && value > maxValue ? maxValue : value;
    }
}

const styles = StyleSheet.create({
    debug: {
        borderWidth: 1,
        borderColor: 'magenta',
    },
    gridContainer: {
        flexDirection: 'column',
        padding: 5,
    },
});
