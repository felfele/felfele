import * as React from 'react';
import { TextInput, View, WebView, Button, TouchableOpacity, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const patchPostMessageJsCode = `(${String(function() {
    var originalPostMessage = window.postMessage
    var patchedPostMessage = function(message, targetOrigin, transfer) {
        originalPostMessage(message, targetOrigin, transfer)
    };
    patchedPostMessage.toString = function() {
        return String(Object.hasOwnProperty).replace('hasOwnProperty', 'postMessage')
    }
    window.postMessage = patchedPostMessage
})})();`;

const navigationActions = {
    Cancel: null,
    Post: null,
};

export class Location extends React.Component<any, any> {
    public static navigationOptions = {
        header: undefined,
        title: 'Select location',
        headerLeft: <Button title='Cancel' onPress={() => navigationActions.Cancel!()} />,
        headerRight: <Button title='Post' onPress={() => navigationActions.Post!()} />,
    };

    private webView: any;

    constructor(props) {
        super(props);
        this.state = {
            latitude: null,
            longitude: null,
            error: null,
        }
        this.postMessage = this.postMessage.bind(this);

        navigationActions.Cancel = this.props.navigation.goBack;
        navigationActions.Post = this.props.navigation.goBack;

        navigator.geolocation.getCurrentPosition((position) => {
            this.setState({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                error: null,
            });
        },
            (error) => this.setState({ error: error.message }),
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
        );

    }

    public render() {
        return (
            <View style={{flexDirection: 'column', padding: 0, flex: 1, height: '100%'}}>
                {/* <WebView
                    javaScriptEnabled
                    injectedJavaScript={patchPostMessageJsCode}
                    source={{uri: 'https://maps.google.com/'}}
                    style={{marginTop: 0, flex: 1}}
                    ref={x => {this.webView = x}}
                    onMessage={e => this.onMessage(JSON.parse(e.nativeEvent.data))}
                /> */}
                <View style={{flex: 1}}>
                    <Text>Latitude: {this.state.latitude}</Text>
                    <Text>Longitude: {this.state.longitude}</Text>
                    {this.state.error ? <Text>Error: {this.state.error}</Text> : null}
                </View>
            </View>
        );
    }

    private postMessage(action) {
        this.webView.postMessage(JSON.stringify(action));
    }

    private onMessage(data) {
        console.log('data from webview', data);
    }
}
