import * as React from 'react';
import { Text, View, Share as ReactShare } from 'react-native';
import { Button } from 'react-native-elements'
import * as QRCode from 'react-native-qrcode';
import DefaultStyle from './DefaultStyle'

export default class Share extends React.Component<any, any> {   
    constructor(props) {
        super(props);
    }

    render() {
        const link = this.props.navigation.state.params.link;
        return (
            <View style={{flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                <Text style={{flex: 1}}>{link}</Text>
                <QRCode
                    style={{flex: 1}}
                    data={link}
                    dimension={200}
                    /> 
                <Button
                    containerViewStyle={{flex: 1}}
                    onPress={async () => { await ReactShare.share({url: link}, {})}}
                    icon={{name: 'share'}}
                    title='Share with app...' />
                <Button
                    containerViewStyle={{flex: 1}}
                    onPress={() => {this.props.navigation.goBack()}}
                    title='Ok' />
            </View>            
        )
    }
}
