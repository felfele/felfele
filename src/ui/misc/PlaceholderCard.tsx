import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../../styles';
import { BoldText, RegularText } from './text';

interface Props {
    image?: React.ReactNode;
    boldText: string;
    regularText: string;
}

export const PlaceholderCard = (props: Props) => {
    return (
        <View style={styles.container}>
            <View style={styles.topPlaceholder}/>
            {props.image &&
            <View style={styles.imageContainer}>
                {props.image}
            </View>}
            <View style={styles.textContainer}>
                <BoldText style={styles.text}>{props.boldText}</BoldText>
                <RegularText style={styles.text}>{props.regularText}</RegularText>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.WHITE,
        marginBottom: 20,
    },
    textContainer: {
        paddingHorizontal: 20,
    },
    text: {
        textAlign: 'center',
        paddingTop: 10,
        fontSize: 14,
        color: Colors.DARK_GRAY,
    },
    imageContainer: {
        marginTop: 10,
        alignItems: 'center',
    },
    topPlaceholder: {
        backgroundColor: Colors.BACKGROUND_COLOR,
        height: 10,
    },
});
