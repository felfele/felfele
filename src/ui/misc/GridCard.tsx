import * as React from 'react';
import { TouchableView } from '../../components/TouchableView';
import { Image, View, Text, GestureResponderEvent, StyleSheet } from 'react-native';
import { Colors } from '../../styles';
import { MediumText } from './text';

interface Props {
    title: string;
    onPress: (event: GestureResponderEvent) => void;
    imageUri: string;
}

export const GridCard = React.memo((props: Props) => (
    <TouchableView style={styles.feedCard} onPress={props.onPress}>
        <Image
            source={{
                uri: props.imageUri,
            }}
            style={{
                width: 170,
                height: 170,
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
