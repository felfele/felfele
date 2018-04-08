import * as React from 'react';
import { TextInput, View, WebView, Button, TouchableOpacity, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface LocationNavigationActions {
    cancel?: () => void;
    post?: () => void;
}

const navigationActions: LocationNavigationActions = {
    cancel: undefined,
    post: undefined,
};

export class Location extends React.Component<any, any> {
    public static navigationOptions = {
        header: undefined,
        title: 'Select location',
        headerLeft: <Button title='Cancel' onPress={() => navigationActions.cancel!()} />,
        headerRight: <Button title='Post' onPress={() => navigationActions.post!()} />,
    };

    private webView: any;

    constructor(props) {
        super(props);
        this.state = {
            latitude: null,
            longitude: null,
            error: null,
        };
        this.postMessage = this.postMessage.bind(this);

        navigationActions.cancel = this.props.navigation.goBack;
        navigationActions.post = this.props.navigation.goBack;

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
