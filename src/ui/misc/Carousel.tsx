import * as React from 'react';

import SwipeableViews from 'react-swipeable-views-native';
// @ts-ignore
import { autoPlay } from 'react-swipeable-views-utils';
import { View, Dimensions, StyleSheet } from 'react-native';
import { Post } from '../../models/Post';
import { ImageView } from '../../components/ImageView';
import { Rectangle } from '../../models/ModelHelper';
import { ImageData } from '../../models/ImageData';
import { Colors } from '../../styles';

const AutoPlaySwipeableViews = autoPlay(SwipeableViews);

const WINDOW_WIDTH = Dimensions.get('window').width;

interface Props {
    post: Post;
    showSquareImages: boolean;
    calculateImageDimensions: (image: ImageData, maxWidth: number, showSquareImages: boolean) => Rectangle;
}

export class Carousel extends React.PureComponent<Props, { index: number }> {
    public state = {
        index: 0,
    };

    public render() {
        return (
            <View>
                <AutoPlaySwipeableViews autoplay={false} onChangeIndex={this.handleChangeIndex}>
                    {this.props.post.images.map((image, index) => {
                        const { width, height } = this.props.calculateImageDimensions(image, WINDOW_WIDTH, this.props.showSquareImages);
                        return (
                            <ImageView
                                testID={(image.uri || '') + index}
                                key={(image.uri || '') + index}
                                source={image}
                                style={{
                                    width: width,
                                    height: height,
                                }}
                            />
                        );
                    })}
            </AutoPlaySwipeableViews>
             <Pagination dots={3} index={this.state.index}/>
            </View>
        );
    }

    private handleChangeIndex = (index: number) => {
        this.setState({
            index,
        });
    }
}

const Pagination = (props: { index: number, dots: number }) => {
    const children = [];

    for (let i = 0; i < props.dots; i++) {
        const backgroundColor = i === props.index ? Colors.BRAND_PURPLE : Colors.LIGHT_GRAY;
        children.push(
            <View style={[styles.dot, { backgroundColor }]} key={i}/>
        );
    }
    return <View style={styles.pagination}>{children}</View>;
};

const styles = StyleSheet.create({
    pagination: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        flexDirection: 'row',
    },
    dot: {
        backgroundColor: '#e4e6e7',
        height: 8,
        width: 8,
        borderRadius: 4,
        margin: 3,
    },
});
