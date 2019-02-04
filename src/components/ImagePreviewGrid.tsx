import * as React from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';

import { ImageData } from '../models/ImageData';
import { TouchableView } from './TouchableView';
import { ImageView } from './ImageView';

export interface StateProps {
    columns: number;
    images: ImageData[];
    height: number;
}

export interface DispatchProps {
    onRemoveImage?: (image: ImageData) => void;
}

type Props = StateProps & DispatchProps;

export class ImagePreviewGrid extends React.Component<Props, any> {
    private width = 0;

    public render() {
        const columns = Math.max(this.props.columns, this.props.images.length);
        const maxWidth = Math.floor(this.width / columns);
        const maxHeight = this.notGreaterThan(maxWidth, this.props.height);

        const images = this.props.images.map((image) =>
            <TouchableView
                onLongPress={() => this.props.onRemoveImage && this.props.onRemoveImage(image)}
                key={image.localPath}
            >
                <ImageView
                    source={image}
                    style={{
                        width: this.notGreaterThan(image.width, maxWidth),
                        height: maxHeight != null ? this.notGreaterThan(image.height, maxHeight) : maxWidth,
                        borderWidth: 1,
                        borderColor: 'white',
                    }}
                />
            </TouchableView>
        );

        return (
            <View
                onLayout={(event) => this.onLayout(event)}
                style={[styles.gridContainer, {height: maxHeight}]}
            >
                <View style={{flexDirection: 'row', width: '100%'}}>
                    {images}
                </View>
            </View>
        );
    }

    private onLayout(event: LayoutChangeEvent) {
        const { width } = event.nativeEvent.layout;
        this.width = width;
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
        padding: 0,
        width: '100%',
    },
});
