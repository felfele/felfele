import * as React from 'react';
import { TextInput, Text, View, WebView, Button, TouchableOpacity, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ImagePicker } from '../ImagePicker';
import StateTracker from '../StateTracker';
import { Backend } from '../Backend';
import { Config } from '../Config';
import { NetworkStatus } from '../NetworkStatus';

declare var window: any;
declare var $: any;

const injectedJavaScript = `(${String(function() {
    // Patch window.postMessage
    var originalPostMessage = window.postMessage
    var patchedPostMessage = function(message, targetOrigin, transfer) {
        originalPostMessage(message, targetOrigin, transfer)
    }
    patchedPostMessage.toString = function() {
        return String(Object.hasOwnProperty).replace('hasOwnProperty', 'postMessage')
    }
    window.postMessage = patchedPostMessage

    // Removing header, footer and navigation from Ghost
    $('.site-wrapper').children('.main-header').remove();
    $('.site-wrapper').children('.site-footer').remove();
    $('.content').children('.pagination').remove();

    // Infinite scroll for Ghost
    var page = 2;
    var url_blog = window.location;
    var last_y_pos = 0;
    var reachedBottom = false;
    $(window).scroll(function () {
        // For pull-to-refresh
        last_y_pos = $(window).scrollTop();
        if ($(window).scrollTop() + $(window).height() == $(document).height() &&
            !reachedBottom) 
        {
            $.get(url_blog + '/page/' + page, function (content) {
                $('.content').append($(content).find(".post").fadeIn());
                page = page + 1;
            }).fail(function() {
                reachedBottom = true;
            });
        }
    });

    // For better pull-to-refresh support
    var touchStart = 0;
    var touchState = 'released';
    window.addEventListener('touchend', function(e) {
        // alert('touchend ' + last_y_pos);
        if (touchState == 'pulling' && Date.now() - touchStart > 700) {
            window.postMessage(0);
        }
        touchState = 'released';
    });
    window.addEventListener('touchstart', function(e) {
        if (last_y_pos == 0) {
            touchState = 'pulling';
            touchStart = Date.now();
        }
    });
    window.addEventListener('touchmove', function(e) {
        if (last_y_pos != 0) {
            touchState = 'released';
        }
    });
})})();`;

class Feed extends React.Component<any, any> {
    // this is any because React Native components are not strictly typed
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/16318
    webView: any;

    static navigationOptions = {
        header: <View style={{height: 100, backgroundColor: 'magenta'}} />
    }

    constructor(props) {
        super(props);
        this.postMessage = this.postMessage.bind(this)
        this.state = {
            version: StateTracker.version,
            uri: this.props.uri,
        }

        StateTracker.listen((oldVersion, newVersion) => this.updateVersion(oldVersion, newVersion));
    }

    reloadWebView() {
        if (NetworkStatus.isConnected()) {
            this.webView.reload();
        }
    }

    updateVersion(oldVersion, newVersion) {
        if (newVersion != this.state.version) {
            this.setState({
                version: newVersion,
                uri: this.state.uri + '#' + newVersion
            })
            this.reloadWebView();
        }
    }

    postMessage(action) {
        this.webView.postMessage(JSON.stringify(action))
    }

    onMessage(data) {
        console.log('data from webview', typeof data, data);
        console.log('data from webview', JSON.parse(data));
        if (typeof data == 'function') {
            eval(data);
        }
        if (data == 0) {
            this.reloadWebView();
        }
    }

    openImagePicker = async () => {
        const pickerResult = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4,3],
            base64: true,
            exif: true,
        });
        if (pickerResult.cancelled == false) {
            const data = {
                uri: pickerResult.uri,
                width: pickerResult.width,
                height: pickerResult.height,
                data: pickerResult.base64,
            }

            try {
                const path = await Backend.ghostAPI.uploadImage(data.uri);
                const markdownText = `![](${path.replace(/\"/g, '')})`;
                await Backend.ghostAPI.uploadPost(markdownText);
            } catch (e) {
                Alert.alert(
                    'Error',
                    'Posting failed, try again later!',
                    [
                        {text: 'OK', onPress: () => console.log('OK pressed')},
                    ]
                );
            }

            StateTracker.updateVersion(StateTracker.version + 1);
        }
    }

    render() {
        return (
            <View style={{flexDirection: 'column', padding: 0, flex: 1, height: '100%'}}>
                <View style={{flex: -1, flexDirection: 'row', borderBottomColor: 'lightgray', borderBottomWidth: 1, alignContent: 'stretch'}}>
                    <TouchableOpacity onPress={() => this.openImagePicker()} style={{flex: 1}}>
                        <Ionicons name='md-camera' size={30} color='gray' style={{paddingTop: 4, paddingLeft: 10}} /> 
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => this.props.navigation.navigate(this.props.post)} style={{flex: 6}}>
                        <Text style={{ height: 40, color: 'gray', fontSize: 14, paddingLeft: 10, paddingTop: 10, alignSelf: 'stretch', flex: 5, flexGrow: 10}}>What's on your mind?</Text>
                    </TouchableOpacity>
                </View>
                <WebView
                    javaScriptEnabled
                    injectedJavaScript={injectedJavaScript}
                    source={{uri: NetworkStatus.isConnected() ? this.state.uri : ''}}
                    style={{marginTop: 0, flex: 10}}
                    ref={x => {this.webView = x}}
                    onMessage={e => this.onMessage(e.nativeEvent.data)}
                />
            </View>            
        )
    }
}

export default Feed;