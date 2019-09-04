import * as React from 'react';
import { TouchableView } from '../../components/TouchableView';
import {
    Image,
    View,
    GestureResponderEvent,
    StyleSheet,
    Dimensions,
    StyleProp,
    ImageStyle,
} from 'react-native';
import { Colors } from '../../styles';
import { MediumText } from './text';
import { ImageDataView } from '../../components/ImageDataView';
import { ModelHelper } from '../../models/ModelHelper';
import { ImageData, BundledImage } from '../../models/ImageData';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
    title: string;
    onPress: (event: GestureResponderEvent) => void;
    image: ImageData;
    imageStyle?: StyleProp<ImageStyle>;
    defaultImage?: BundledImage;
    size: number;
    modelHelper: ModelHelper;
    isSelected: boolean;
}

export const GRID_SPACING = 10;
export const GRID_CARD_COUNT_IN_ROW = 2;

export const getGridCardSize = () => {
    const windowWidth = Dimensions.get('window').width;
    return Math.floor((windowWidth - GRID_SPACING * 3) / GRID_CARD_COUNT_IN_ROW);
};

export const GridCard = React.memo((props: Props) => (
    <TouchableView style={styles.feedCard} onPress={props.onPress}>
        <ImageDataView
            source={props.image}
            defaultImage={props.defaultImage}
            modelHelper={props.modelHelper}
            style={[{
                width: props.size,
                height: props.size,
            }, props.imageStyle]}
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
        {props.isSelected &&
            <View style={styles.feedCardOverlay}>
                <Icon name='check' color={Colors.WHITE} size={48} />
            </View>
        }
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
    feedCardOverlay: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 100,
        backgroundColor: 'rgba(98, 0, 234, 0.5)',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    feedCardOverlayText: {
        color: Colors.WHITE,
        fontSize: 14,
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
