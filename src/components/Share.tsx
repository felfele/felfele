import * as React from 'react';
import { Text, View, Share as ReactShare, StyleSheet, Button} from 'react-native';
import { Colors } from '../styles';
import QRCode from 'react-native-qrcode-svg';

export class Share extends React.PureComponent<any, any> {
    public render() {
        const link = this.props.navigation.state.params.link;
        return (
            <View style={styles.shareContainer}>
                <Text style={styles.linkText}>{link}</Text>
                <QRCode
                    value={link}
                    size={300}
                    backgroundColor={Colors.DARK_GRAY}
                    color='white'
                    />
                <Button
                    onPress={async () => await ReactShare.share({
                        url: link,
                        title: 'Share your post',
                        message: 'Share the link with others',
                    }, {})}
                    title='Share with app...' />
                <Button
                    onPress={() => this.props.navigation.goBack()}
                    title='Ok' />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    shareContainer: {
        paddingTop: 50,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
    },
    linkText: {
        fontSize: 14,
        color: Colors.LIGHT_GRAY,
        paddingVertical: 4,
        width: 300,
        textAlign: 'center',
    },
});
