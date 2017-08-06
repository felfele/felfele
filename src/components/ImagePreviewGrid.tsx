import * as React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { Col, Row, Grid } from "react-native-easy-grid";

const styles = StyleSheet.create({
    debug: {
        borderWidth: 1, 
        borderColor: 'magenta'
    }
});

export class ImagePreviewGrid extends React.Component<any, any> {
    width = 0;
    height = 0;

    constructor(props) {
        super(props);
    }

    max(value, maxValue) {
        return value > maxValue ? maxValue : value;
    }
    
    onLayout(event) {
        const {x, y, height, width} = event.nativeEvent.layout;
        this.width = width;
        this.height = height;
    }

    render() {
        const columns = this.props.columns;
        const maxWidth = Math.floor(this.width / columns);
        const maxHeight = Math.floor(this.max(this.height, maxWidth));
        
        console.log('image', maxWidth);
        
        const images = this.props.images.map((image) => 
            <Image source={{uri: image.uri}}
                style={{width: this.max(image.width, maxWidth),
                        height: this.max(image.height, maxHeight),
                        borderWidth: 1,
                        borderColor: 'white'}}
                    key={image.uri}
            />
        );

        const rows: JSX.Element[] = [];
        for (let i = 0; i < Math.floor(images.length / columns) + 1; i++) {
            const rowImages: string[] = [];
            for (let j = i * columns; j < this.max(i * columns + columns, images.length); j++) {
                rowImages.push(images[j]);
            }
            const rowKey = `imageview-grid-row-${i}`;
            rows.push(
                <Row size={1} key={rowKey}>
                    {rowImages}
                </Row>
            )
        }

        return (
            <View
                onLayout={(event) => this.onLayout(event)}
                style={{flexDirection: 'row', padding: 0, flex: 1, width: '100%', height: '20%'}} 
            >
                <Grid>
                    {rows}
                </Grid>
            </View>
        )
    }
}
