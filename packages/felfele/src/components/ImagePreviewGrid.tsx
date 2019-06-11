import * as React from 'react';
import {
    Platform,
    StyleSheet,
    Animated,
    Easing,
} from 'react-native';

import { ImageData } from '@felfele/felfele-core';
import { TouchableView } from './TouchableView';
import { ImageDataView } from './ImageDataView';
import { ModelHelper } from '@felfele/felfele-core';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../styles';
import SortableList, { RowProps } from 'react-native-sortable-list';

export interface StateProps {
    images: ImageData[];
    imageSize: number;
    modelHelper: ModelHelper;
}

export interface DispatchProps {
    onRemoveImage: (image: ImageData) => void;
    onReleaseRow: (_: string, nextOrder: Array<number>) => void;
}

type Props = StateProps & DispatchProps;

export const GRID_SPACING = 10;

export class ImagePreviewGrid extends React.Component<Props> {
    public render() {
        if (this.props.images.length === 0) {
            return null;
        }
        const doublePadding = 10;
        return (
            <SortableList
                style={[styles.gridContainer, { height: this.props.imageSize + doublePadding }]}
                contentContainerStyle={{ padding: 5 }}
                horizontal={true}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                scrollEnabled={true}
                data={this.props.images}
                renderRow={(props: RowProps) => (
                    <Item
                        data={props.data}
                        active={props.active}
                        imageSize={this.props.imageSize}
                        modelHelper={this.props.modelHelper}
                        onRemoveImage={this.props.onRemoveImage}
                    />
                )}
                // @ts-ignore needs d.ts update
                onReleaseRow={this.props.onReleaseRow}
                keyboardShouldPersistTaps='always'
            />
        );
    }
}

interface ItemProps {
    data: ImageData;
    active: boolean;
    imageSize: number;
    modelHelper: ModelHelper;
    onRemoveImage: (image: ImageData) => void;
}

class Item extends React.Component<ItemProps> {
    private active = new Animated.Value(0);
    private itemStyle = {
        ...Platform.select({
            ios: {
                transform: [{
                    scale: this.active.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.1],
                    }),
                }],
            },
            android: {
                transform: [{
                    scale: this.active.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.07],
                    }),
                }],
                elevation: this.active.interpolate({
                inputRange: [0, 1],
                outputRange: [2, 6],
                }),
            },
        }),
    };

    public componentWillReceiveProps(nextProps: ItemProps) {
        if (this.props.active !== nextProps.active) {
            Animated.timing(this.active, {
                duration: 300,
                easing: Easing.exp,
                toValue: Number(nextProps.active),
            }).start();
        }
    }

    public render() {
        return (
            <Animated.View
                style={[
                    styles.item,
                    this.itemStyle,
                ]}
            >
                <ImageDataView
                    source={this.props.data}
                    style={{
                        width: this.notGreaterThan(this.props.data.width, this.props.imageSize),
                        height: this.notGreaterThan(this.props.data.height, this.props.imageSize),
                    }}
                    modelHelper={this.props.modelHelper}
                    background={true}
                >
                    <TouchableView
                        style={styles.delete}
                        onPress={() => this.props.onRemoveImage(this.props.data)}
                        hitSlop={{
                            top: 5,
                            left: 5,
                            bottom: 5,
                            right: 5,
                        }}
                    >
                        <Icon name={'close-circle'} size={24}/>
                    </TouchableView>
                </ImageDataView>
            </Animated.View>
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
    item: {
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        padding: 5,
    },
});
