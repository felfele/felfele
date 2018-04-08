import * as React from 'react';
import { Text, View, Share as ReactShare, StyleSheet, Button} from 'react-native';
import * as QRCode from 'react-native-qrcode';

export class Share extends React.PureComponent<any, any> {
    public render() {
        const link = this.props.navigation.state.params.link;
        return (
            <View style={styles.shareContainer}>
                <Text style={{flex: 1}}>{link}</Text>
                <QRCode
                    style={{flex: 1}}
                    data={link}
                    dimension={200}
                    />
                <Button
                    onPress={async () => await ReactShare.share({url: link}, {})}
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
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
