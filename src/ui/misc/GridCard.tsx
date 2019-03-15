import * as React from 'react';
import { TouchableView } from '../../components/TouchableView';
import {
    Image,
    View,
    GestureResponderEvent,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { Colors } from '../../styles';
import { MediumText } from './text';
import { ImageDataView } from '../../components/ImageDataView';
import { ModelHelper } from '../../models/ModelHelper';

interface Props {
    title: string;
    onPress: (event: GestureResponderEvent) => void;
    imageUri: string;
    size: number;
    modelHelper: ModelHelper;
}

export const GRID_SPACING = 10;
export const GRID_CARD_COUNT_IN_ROW = 2;

export const getGridCardSize = () => {
    const windowWidth = Dimensions.get('window').width;
    return (windowWidth - GRID_SPACING * 3) / GRID_CARD_COUNT_IN_ROW;
};

export const GridCard = React.memo((props: Props) => (
    <TouchableView style={styles.feedCard} onPress={props.onPress}>
        <ImageDataView
            source={{
                uri: props.imageUri,
            }}
            modelHelper={props.modelHelper}
            style={{
                width: props.size,
                height: props.size,
            }}
            resizeMode='cover'
        />
        <View style={styles.feedCardTextContainer}>
            <MediumText
                style={styles.feedCardText}
                ellipsizeMode='tail'
                numberOfLines={1}
            >
                {props.title}
            </MediumText>
        </View>
    </TouchableView>
));

const styles = StyleSheet.create({
    label: {
        paddingHorizontal: 10,
        paddingTop: 20,
        paddingBottom: 7,
        color: Colors.GRAY,
    },
    feedCard: {
        backgroundColor: Colors.WHITE,
    },
    feedCardText: {
        color: Colors.DARK_GRAY,
        fontSize: 14,
    },
    feedCardTextContainer: {
        height: 30,
        alignItems: 'center',
        marginHorizontal: 10,
        justifyContent: 'center',
    },
});
