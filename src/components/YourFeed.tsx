import * as React from 'react';
import { CameraRoll, Dimensions, TextInput, Text, View, WebView, TouchableOpacity, Alert, ScrollView, FlatList, Image, RefreshControl, StyleSheet } from 'react-native';
import { Card, Button, ButtonGroup, List, Tile, Icon as ElementIcon } from 'react-native-elements';
import { Gravatar } from 'react-native-gravatar';
import Markdown from 'react-native-easy-markdown';
import Icon from 'react-native-vector-icons/Ionicons';
import RNFetchBlob from 'react-native-fetch-blob';

import { AsyncImagePicker, Response as ImagePickerResponse } from '../AsyncImagePicker';
import StateTracker from '../StateTracker';
import { Config } from '../Config';
import { Backend } from '../Backend';
import { PostManager } from '../PostManager';
import { Post, ImageData } from '../models/Post';
import { Debug } from '../Debug';
import { NetworkStatus } from '../NetworkStatus';
import { DateUtils } from '../DateUtils';

class YourFeed extends React.Component<any, any> {
    static navigationOptions = {
        header: <View style={{ height: 100, backgroundColor: 'magenta' }} />
    }

    containerStyle = {};

    constructor(props) {
        super(props);
        this.state = {
            version: StateTracker.version,
            uri: this.props.uri,
            posts: this.props.posts,
            selectedPost: null,
            isRefreshing: false,
            isOnline: NetworkStatus.isConnected(),
        }

        this.containerStyle = {
            backgroundColor: '#fff',
            borderRadius: 3,
            padding: 0,
            paddingBottom: 10,
            paddingTop: 0,
            marginBottom: 25,
            marginTop: 0,
        }

        NetworkStatus.addConnectionStateChangeListener((result) => this.onConnectionStateChange(result));
        StateTracker.listen((oldVersion, newVersion) => this.updateVersion(oldVersion, newVersion));
    }

    componentDidMount() {
        PostManager.loadPosts().then(() => {
            this.setState({
                posts: PostManager.getAllPosts()
            })
        });
    }

    updateVersion(oldVersion, newVersion) {
        if (newVersion != this.state.version) {
            this.setState({
                version: newVersion,
                uri: this.state.uri + '#' + newVersion,
                posts: PostManager.getAllPosts(),
            })
        }
    }

    onConnectionStateChange(connected) {
        this.setState({
            isOnline: connected,
        })
    }

    async onRefresh() {
        try {
            await PostManager.syncPosts();
            this.setState({
                posts: PostManager.getAllPosts()
            })
        } catch(e) {
            this.setState({
                isRefreshing: false
            });
            Alert.alert(
                'Error',
                'No connection to the server, try again later!',
                [
                    {text: 'OK', onPress: () => console.log('OK pressed')},
                ]
            );
        }

    }

    isCameraRollPhoto(pickerResult: ImagePickerResponse) {
        if (pickerResult.origURL) {
            if (pickerResult.origURL.startsWith('assets-library://') || pickerResult.origURL.startsWith('content://')) {
                return true;
            }
        }
        return false;
    }

    getFilenameExtension(filename) {
        const a = filename.split(".");
        if(a.length === 1 || ( a[0] === "" && a.length === 2 ) ) {
            return "";
        }
        return a.pop().toLowerCase();
    }

    openImagePicker = async () => {
        const pickerResult = await AsyncImagePicker.showImagePicker({
            allowsEditing: true,
            aspect: [4, 3],
            base64: true,
            exif: true,
        });
        
        console.log('openImagePicker result: ', pickerResult);

        if (pickerResult.error) {
            console.error('openImagePicker: ', pickerResult.error);
            return;
        }

        if (pickerResult.didCancel) {
            return;
        }

        let localPath = pickerResult.origURL || '';
        if (!this.isCameraRollPhoto(pickerResult) && Config.saveToCameraRoll) {
            localPath = await CameraRoll.saveToCameraRoll(pickerResult.uri);
        }

        console.log(localPath);

        // Copy file to Document dir
        // const hash = await RNFetchBlob.fs.hash(pickerResult.uri);
        // const extension = this.getFilenameExtension(pickerResult.uri);
        // const filename = `${RNFetchBlob.fs.dirs.DocumentDir}/${hash}.${extension}`
        // await RNFetchBlob.fs.cp(pickerResult.uri, filename);
        
        const data: ImageData = {
            uri: localPath,
            width: pickerResult.width,
            height: pickerResult.height,
            data: pickerResult.data,
            localPath: localPath,
        }

        const post: Post = {
            images: [data],
            text: '',
            createdAt: Date.now(),
        }

        try {
            PostManager.saveAndSyncPost(post);
        } catch (e) {
            Alert.alert(
                'Error',
                'Posting failed, try again later!',
                [
                    { text: 'OK', onPress: () => console.log('OK pressed') },
                ]
            );
        }
    }

    getImageUri(image: ImageData) {
        if (image.localPath) {
            return image.localPath;
        }
        return image.uri;
    }

    isPostSelected(post) {
        return this.state.selectedPost && this.state.selectedPost._id == post._id;
    }

    togglePostSelection(post) {
        if (this.isPostSelected(post)) {
            this.setState({ selectedPost: null });
        } else {
            this.setState({ selectedPost: post });
        }        
    }

    onDeleteConfirmation(post) {
        Alert.alert(
            'Are you sure you want to delete?',
            undefined,
            [
                { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
                { text: 'OK', onPress: async () => await PostManager.deletePost(post) },
            ],
            { cancelable: false }
        );
    }

    renderButtonsIfSelected(post) {
        const iconSize = 24;
        if (this.isPostSelected(post)) {
            return (
                <View style={styles.itemImageContainer}>
                    <TouchableOpacity style={styles.like}>
                        {!this.state.isLiked ? <Icon name="ios-heart-outline" size={iconSize} color="black" /> : <Icon name="ios-heart" size={30} color="red" />}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.comment} onPress={() => alert('go comment!')}>
                        <Icon name="ios-chatbubbles-outline" size={iconSize} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.share} onPress={() => this.props.navigation.navigate('Share', {link: 'http://192.168.1.49:2368#' + post._id})}>
                        <Icon name="ios-redo-outline" size={iconSize} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.share} onPress={() => this.onDeleteConfirmation(post)}>
                        <Icon name="ios-trash-outline" size={iconSize} color="black" />
                    </TouchableOpacity>
                </View>
            )
        }
        return [];
    }

    renderCardTop(post) {
        const printableTime = DateUtils.printableElapsedTime(post.createdAt);
        return (
            <View style={styles.infoContainer}>
                <Gravatar options={{
                    email: Config.loginData.username,
                    secure: true,
                    parameters: { "size": "100", "d": "mm" },
                }}
                    style={styles.image}
                />
                <View style={styles.usernameContainer}>
                    <Text style={styles.username}>Attila</Text>
                    <Text style={styles.location}>{printableTime}</Text>
                </View>
            </View>
        )
    }

    renderCardWithOnlyText(post) {
        
        return (
            <Card
                containerStyle={{...this.containerStyle, 
                    margin: 0,
                    paddingTop: 5,
                    paddingBottom: 5,
                    borderWidth: 0,
                }}
                key={'card-' + post._id}
            >
                <TouchableOpacity
                    onLongPress={ () => this.togglePostSelection(post) }
                >
                    { this.renderCardTop(post) }
                    <Markdown style={{
                        marginVertical: 10,
                        marginHorizontal: 10,
                    }}>{post.text}</Markdown>
                </TouchableOpacity>
                { this.renderButtonsIfSelected(post) }
            </Card>
        )
    }

    renderCardWithMultipleImages(post) {
        return (
            <Card
                containerStyle={this.containerStyle}
                key={'card-' + post._id}

            >
                <TouchableOpacity 
                    style={{ paddingTop: 0 }}
                    onLongPress={ () => this.togglePostSelection(post) }
                >
                    {
                        post.images.map((image, index) => {
                            return <Tile
                                imageSrc={{
                                    uri: this.getImageUri(image),
                                }}
                                featured={false}
                                activeOpacity={0.1}
                                key={`image-${post._id}-${index}`}
                                onLongPress={ () => {
                                    this.setState({selectedPost: post});
                                }}
                            />
                        })
                    }
                    { post.text == '' ||
                        <Markdown style={{
                            marginVertical: 10
                        }}>{post.text}</Markdown>
                    }

                </TouchableOpacity>
                { this.renderButtonsIfSelected(post) }
            </Card>
        )
    }

    renderCard(post: Post) {
        const toBase64 = (data) => `data:image/gif;base64,${data}`;

        if (post.images.length == 0) {
            return this.renderCardWithOnlyText(post);
        } else if (post.images.length > 1) {
            return this.renderCardWithMultipleImages(post);
        } else {
            return (
                <Card
                    containerStyle={{...this.containerStyle, 
                        margin: 0,
                        padding: 0,
                        paddingTop: 5,
                        paddingBottom: 5,
                        borderWidth: 0,
                    }}
                    key={'card-' + post._id}
                >

                { this.renderCardTop(post) }
                <Tile
                    imageSrc={{
                        uri: this.getImageUri(post.images[0]),
                    }}
                    width={Dimensions.get('window').width}
                    height={Dimensions.get('window').width}
                    featured={false}
                    activeOpacity={0.95}
                    focusedOpacity={1}
                    key={`image-${post._id}`}
                    onPress={ () => this.togglePostSelection(post) }
                    containerStyle = {{
                        backgroundColor: '#fff',
                        padding: 0,
                        paddingTop: 0,
                        marginTop: 0,
                    }}
                    contentContainerStyle={{
                        padding: 0,
                        margin: 0,
                        paddingBottom: 0,
                        paddingTop: 5,
                        paddingLeft: 5,
                        paddingRight: 0,
                        backgroundColor: 'white',
                    }}
                >                    
                    { post.text == '' ||
                        <Markdown style={{
                            marginVertical: 10
                        }}>{post.text}</Markdown>
                    }
                    { this.renderButtonsIfSelected(post) }
                </Tile>
                </Card>
            );
        }
    }

    renderOfflineHeader() {
        if (NetworkStatus.isConnected()) {
            return [];
        }
        return (
            <View style={{
                height: 20,
                backgroundColor: 'black',
            }}
            >
                <Text style={{
                    color: 'white',
                    textAlign: 'center'
                }}
                >You are offline</Text>
            </View>
        )
    }

    renderListHeader() {
        return (
            <View style={{
                    flex: -1,
                    flexDirection: 'row',
                    borderBottomWidth: 1,
                    borderBottomColor: 'lightgray',
                    alignContent: 'stretch',
                }}
            >
                <TouchableOpacity onPress={() => this.openImagePicker()} style={{ flex: 1 }}>
                    <ElementIcon 
                        name='camera-alt'
                        size={30}
                        color='gray'
                        style={{
                            paddingTop: 4,
                            paddingLeft: 10,
                            margin: 0,
                        }} />
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => 
                        this.props.navigation.navigate(this.props.post)
                    } 
                    style={{ 
                        flex: 6 
                    }}
                >
                    <Text 
                        style={{
                            height: 30,
                            color: 'gray',
                            fontSize: 14,
                            paddingLeft: 15,
                            paddingTop: 6,
                            marginLeft: 0,
                            marginRight: 15,
                            marginVertical: 3,
                            marginBottom: 15,
                            alignSelf: 'stretch',
                            flex: 5,
                            flexGrow: 10,
                        }}
                    >What's your story?</Text>
                </TouchableOpacity>
            </View>
        )
    }

    render() {
        return (
            <View style={{
                flexDirection: 'column',
                padding: 0,
                flex: 1, 
                height: '100%' }}
            >
                { this.renderOfflineHeader() }
                <FlatList
                    ListHeaderComponent={this.renderListHeader()}
                    data={this.state.posts}
                    renderItem={(obj) => this.renderCard(obj.item)}
                    keyExtractor={(item, index) => item._id}
                    extraData={this.state}
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.isRefreshing}
                            onRefresh={async () => this.onRefresh() }
                        />
                    }
                />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {backgroundColor:'white',paddingTop:5},
    infoContainer : {flexDirection:'row',height:38,alignSelf:'stretch', marginBottom: 5, marginLeft: 5},
    image: {borderRadius : 16 , width:32 , height:32, marginHorizontal :3 , marginVertical : 3 },
    usernameContainer: {justifyContent:'center',flexDirection:'column'},
    location: {fontSize:10},
    itemImageContainer: {flexDirection:'row', height:40, alignSelf:'stretch', marginLeft: 5},
    like: {marginHorizontal:5,marginVertical:5,marginLeft:5},
    comment: {marginHorizontal:10,marginVertical:5},
    share: {marginHorizontal:10,marginVertical:5},
    likeCount: {flexDirection:'row',alignItems:'center',marginLeft:2},
    commentItem: {fontSize:10 , color:'rgba(0, 0, 0, 0.5)',marginTop:5},
    captionContainer: {marginTop:2 ,flexDirection:'row',alignItems:'center'},
    captionText: { fontSize:12,fontWeight:'bold' },
    dateText: {fontSize:8 , color:'rgba(0, 0, 0, 0.5)',marginTop:5},
    seperator: {height:1,alignSelf:'stretch',marginHorizontal:10,backgroundColor:'rgba(0, 0, 0, 0.2)'},
    hashTag: {fontStyle: 'italic',color:'blue'},
    footer: {marginVertical:5,alignSelf:'stretch',marginHorizontal:20,flexDirection:'column'},
    username: {fontWeight: 'bold'},
    text: {fontSize:12,color:'black'},
    likedContainer:{backgroundColor:'transparent',flex:1,justifyContent:'center',alignItems:'center'}
})

export default YourFeed;