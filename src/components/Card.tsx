import * as React from 'react';
import { Post, getAuthorImageUri } from '../models/Post';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, DefaultStyle } from '../styles';
import { View, ActivityIndicator, TouchableOpacity, TouchableWithoutFeedback, Dimensions, Platform, StyleSheet, Image, Text, Linking } from 'react-native';
import { TouchableView } from './TouchableView';
import { DateUtils } from '../DateUtils';
import { Utils } from '../Utils';
import { ImageView } from './ImageView';
import { isSwarmLink } from '../Swarm';
import { ImageData } from '../models/ImageData';
import Markdown from 'react-native-easy-markdown';
import { ErrorBoundary } from './ErrorBoundary';

const WindowWidth = Dimensions.get('window').width;

interface CardProps {
    post: Post;
    isSelected: boolean;
    showSquareImages: boolean;
    togglePostSelection: (post: Post) => void;
    openPost: (post: Post) => void;
    onDeleteConfirmation: (post: Post) => void;
    onSharePost: (post: Post) => void;
    navigate: (view: string, {}) => void;
}

export const Card = (props: CardProps) => {
    if (props.post.images.length === 0) {
        return <CardWithText {...props}/>;
    } else {
        return (
            <View
                style={[styles.container, {
                    margin: 0,
                    padding: 0,
                    paddingTop: 5,
                    borderWidth: 0,
                }]}
                key={'card-' + props.post._id}
                testID={'YourFeed/Post' + props.post._id}
            >

                <CardTop post={props.post} navigate={props.navigate}/>
                <TouchableOpacity
                    activeOpacity={1}
                    onLongPress={() => props.togglePostSelection(props.post)}
                    onPress={() => props.openPost(props.post)}
                    style = {{
                        backgroundColor: '#fff',
                        padding: 0,
                        paddingTop: 0,
                        marginTop: 0,
                    }}
                >
                    {props.post.images.map((image, index) => {
                        const [width, height] = calculateImageDimensions(image, WindowWidth, props.showSquareImages);
                        return (
                            <ImageView
                                testID={image.uri || '' + index}
                                key={image.uri || '' + index}
                                source={image}
                                style={{
                                    width: width,
                                    height: height,
                                }}
                            />
                        );
                    })}
                    { props.post.text === '' ||
                        <CardMarkdown key={props.post._id} text={props.post.text}/>
                    }
                    <ButtonList {...props}/>
                </TouchableOpacity>
            </View>
        );
    }
};

const ActionIcon = (props: { name: string}) => {
    const iconSize = 20;
    return <Icon name={props.name} size={iconSize} color={Colors.DARK_GRAY} />;
};

const ButtonList = (props: CardProps) => {
    const likeIconName = props.post.liked === true ? 'heart' : 'heart-outline';
    const shareIconName = props.post.link != null ? 'share' : 'share-outline';
    if (props.isSelected) {
        return (
            <View
                testID='CardButtonList'
                style={styles.itemImageContainer}>
                <TouchableView style={styles.like} onPress={() => props.post.liked = true}>
                    <ActionIcon name={likeIconName}/>
                </TouchableView>
                <TouchableView style={styles.comment} onPress={() => alert('go comment!')}>
                    <ActionIcon name='comment-multiple-outline'/>
                </TouchableView>
                <TouchableView style={styles.share} onPress={() => props.onDeleteConfirmation(props.post)}>
                    <ActionIcon name='trash-can-outline'/>
                </TouchableView>
                <TouchableView style={styles.share}>
                    {/* <ActionIcon name='playlist-edit'/> */}
                </TouchableView>
                <TouchableView style={styles.share} onPress={() => props.onSharePost(props.post)}>
                    { props.post.isUploading === true
                        ? <ActivityIndicator color={Colors.DARK_GRAY} />
                        : <ActionIcon name={shareIconName}/>
                    }
                </TouchableView>
            </View>
        );
    }
    return <View/>;
};

const renderCardTopIcon = (post: Post) => {
    if (post.author) {
        const imageUri = getAuthorImageUri(post.author);
        const imageSource = imageUri === ''
            ? require('../../images/user_circle.png')
            : { uri: imageUri };
        return (
            <Image source={imageSource} style={DefaultStyle.favicon} />
        );
    } else {
        return null;
    }
};

const CardTop = (props: { post: Post, navigate: (view: string, {}) => void }) => {
    const printableTime = DateUtils.printableElapsedTime(props.post.createdAt) + ' ago';
    const username = props.post.author ? props.post.author.name : 'Space Cowboy';
    const url = props.post.link || '';
    const hostnameText = url === '' ? '' : ' -  ' + Utils.getHumanHostname(url);
    return (
        <TouchableOpacity
            testID={'CardTop'}
            onPress={() => props.navigate('Feed', { author: props.post.author && props.post.author })}
            style={styles.infoContainer}
        >
            { renderCardTopIcon(props.post) }
            <View style={styles.usernameContainer}>
                <Text style={styles.username} numberOfLines={1}>{username}</Text>
                <Text style={styles.location}>{printableTime}{hostnameText}</Text>
            </View>
        </TouchableOpacity>
    );
};

export const CardWithText = (props: CardProps) => {
    return (
        <View
            style={[styles.container, {
                margin: 0,
                paddingTop: 5,
                borderWidth: 0,
            }]}
            key={'card-' + props.post._id}
            testID={'YourFeed/Post' + props.post._id}
        >
            <TouchableOpacity
                onLongPress={ () => props.togglePostSelection(props.post) }
                onPress={ () => props.openPost(props.post)}
                activeOpacity={1}
            >
                <CardTop post={props.post} navigate={props.navigate} />
                { props.post.text != null &&
                <CardMarkdown key={props.post._id} text={props.post.text}/>}
            </TouchableOpacity>
            <ButtonList {...props} />
        </View>
    );
};

const CardMarkdown = (props: { text: string }) => (
    <ErrorBoundary>
        <Markdown
            style={styles.markdownStyle}
            renderLink={(href, title, children) => {
                return (
                    <TouchableWithoutFeedback
                        key={'linkWrapper_' + href + Date.now()}
                        onPress={() => Linking.openURL(href).catch(() => { /* nothing */ })}
                    >
                        <Text key={'linkWrapper_' + href + Date.now()} style={{textDecorationLine: 'underline'}}>
                            {children}
                        </Text>
                    </TouchableWithoutFeedback>
                );
            }}
        >{props.text}</Markdown>
    </ErrorBoundary>
);

const openPost = async (post: Post) => {
    if (post.link) {
        if (!isSwarmLink(post.link)) {
            await Linking.openURL(post.link);
        }
    }
};

const calculateImageDimensions = (image: ImageData, maxWidth: number, showSquareImages: boolean): number[] => {
    if (showSquareImages) {
        return [maxWidth, maxWidth];
    }
    return calculateImageDimensions(image, maxWidth, showSquareImages);
};

const HeaderOffset = 20;
const TranslucentBarHeight = Platform.OS === 'ios' ? HeaderOffset : 0;
const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
        padding: 0,
        paddingTop: 0,
        paddingBottom: 0,
        marginBottom: 12,
        marginTop: 0,
    },
    infoContainer : {
        flexDirection: 'row',
        height: 38,
        alignSelf: 'stretch',
        marginBottom: 5,
        marginLeft: 5,
    },
    usernameContainer: {
        justifyContent: 'center',
        flexDirection: 'column',
    },
    location: {
        fontSize: 10,
        color: 'gray',
    },
    itemImageContainer: {
        flexDirection: 'row',
        height: 40,
        alignSelf: 'stretch',
        marginLeft: 5,
        marginTop: 5,
        justifyContent: 'space-evenly',
    },
    like: {
        marginHorizontal: 20,
        marginVertical: 5,
        marginLeft: 5,
    },
    comment: {
        marginHorizontal: 20,
        marginVertical: 5,
    },
    share: {
        marginHorizontal: 20,
        marginVertical: 5,
    },
    edit: {
        marginHorizontal: 20,
        marginVertical: 5,
    },
    likeCount: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 2,
    },
    commentItem: {
        fontSize: 10 ,
        color: 'rgba(0, 0, 0, 0.5)',
        marginTop: 5,
    },
    captionContainer: {
        marginTop: 2 ,
        flexDirection: 'row',
        alignItems: 'center',
    },
    captionText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    dateText: {
        fontSize: 8,
        color: 'rgba(0, 0, 0, 0.5)',
        marginTop: 5,
    },
    seperator: {
        height: 1,
        alignSelf: 'stretch',
        marginHorizontal: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    hashTag: {
        fontStyle: 'italic',
        color: 'blue',
    },
    footer: {
        marginVertical: 5,
        alignSelf: 'stretch',
        marginHorizontal: 20,
        flexDirection: 'column',
    },
    username: {
        fontWeight: 'bold',
        color: Colors.DARK_GRAY,
    },
    text: {
        fontSize: 12,
        color: Colors.DARK_GRAY,
    },
    likedContainer: {
        backgroundColor: 'transparent',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    markdownStyle: {
        marginVertical: 10,
        marginHorizontal: 10,
    },
    translucentBar: {
        height: TranslucentBarHeight,
        width: '100%',
        position: 'absolute',
        backgroundColor: '#e6e6e6ff',
        opacity: 0.5,
        top: 0,
        left: 0,
    },
    refreshControl: {
    },
});
