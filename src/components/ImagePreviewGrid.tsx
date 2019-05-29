import * as React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

import { ImageData } from '../models/ImageData';
import { TouchableView } from './TouchableView';
import { ImageDataView } from './ImageDataView';
import { ModelHelper } from '../models/ModelHelper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
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
                    background={true}
                >
                    <TouchableView
                        style={styles.delete}
                        onPress={() => this.props.onRemoveImage && this.props.onRemoveImage(image)}
                    >
                        <Icon name={'close-circle'} size={24}/>
                    </TouchableView>
                </ImageDataView>
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
    delete: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.WHITE,
        top: 2,
        right: 2,
    },
});
